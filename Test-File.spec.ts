import { test, expect, Page } from '@playwright/test';

/**
 * ===============================
 * FILE: tests/test-1.spec.ts
 * AutomationExercise E2E:
 * signup (random user) -> add multiple products (modal handled) ->
 * checkout (screenshots) -> pay -> review (random)
 * ===============================
 */

test.setTimeout(240_000);

type UserData = {
  runId: string;
  name: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company: string;
  address: string;
  country: string; // value from select
  state: string;
  city: string;
  zipcode: string;
  mobile: string;
};

function log(msg: string) {
  console.log(`[LOG] ${msg}`);
}

// ===============================
// STEP 0 - Helpers: Random data
// ===============================
function buildRandomUser(): UserData {
  const ts = Date.now();
  const suffix = Math.floor(1000 + Math.random() * 8999);
  const runId = `${ts}-${suffix}`;

  const firstName = `User${suffix}`;
  const lastName = `QA`;
  const name = `${firstName}`;
  const email = `asaf.qa+${runId}@example.com`; // unique each run
  const password = `Pw@${suffix}12345`;

  const countries = ['India', 'United States', 'Canada', 'Australia', 'Israel', 'New Zealand', 'Singapore'];
  const country = countries[Math.floor(Math.random() * countries.length)];

  return {
    runId,
    name,
    email,
    password,
    firstName,
    lastName,
    company: `Company-${suffix}`,
    address: `Street ${Math.floor(10 + Math.random() * 90)}`,
    country,
    state: `State-${suffix}`,
    city: `City-${suffix}`,
    zipcode: `${Math.floor(10000 + Math.random() * 89999)}`,
    mobile: `05${Math.floor(10000000 + Math.random() * 89999999)}`,
  };
}

// ===============================
// STEP A - Helpers: Ads / overlays
// ===============================
async function closeGoogleVignetteIfPresent(page: Page) {
  // If URL is like: /checkout#google_vignette
  const url = page.url();
  if (!/google_vignette/i.test(url)) return;

  log('⚠️ Google vignette detected. Trying to close ad (#dismiss-button)...');

  // 1) Try on main page
  const dismissMain = page.locator('#dismiss-button, [id="dismiss-button"]');
  if (await dismissMain.first().isVisible().catch(() => false)) {
    await dismissMain.first().click({ timeout: 5_000 }).catch(() => {});
    await page.waitForLoadState('domcontentloaded');
    return;
  }

  // 2) Try inside frames (best-effort)
  for (const frame of page.frames()) {
    const dismissInFrame = frame.locator('#dismiss-button, [id="dismiss-button"]');
    if (await dismissInFrame.first().isVisible().catch(() => false)) {
      await dismissInFrame.first().click({ timeout: 5_000 }).catch(() => {});
      await page.waitForLoadState('domcontentloaded');
      return;
    }
  }

  // 3) Last resort: try generic close buttons
  const genericClose = page.locator('[aria-label*="Close ad" i], [aria-label="Close" i], button:has-text("Close")');
  if (await genericClose.first().isVisible().catch(() => false)) {
    await genericClose.first().click({ timeout: 5_000 }).catch(() => {});
    await page.waitForLoadState('domcontentloaded');
  }
}

async function closeCartModalIfVisible(page: Page, action: 'continue' | 'viewCart') {
  const modal = page.locator('#cartModal');
  const isOpen = await modal.isVisible().catch(() => false);
  if (!isOpen) return;

  // Modal buttons:
  const continueBtn = modal.locator('button.btn.btn-success.close-modal.btn-block:has-text("Continue Shopping")');
  const viewCartLink = modal.locator('a:has-text("View Cart")');

  if (action === 'viewCart') {
    if (await viewCartLink.isVisible().catch(() => false)) {
      await viewCartLink.click({ timeout: 10_000 });
      await page.waitForLoadState('domcontentloaded');
      return;
    }
    // fallback: try close then go cart directly
    if (await continueBtn.isVisible().catch(() => false)) {
      await continueBtn.click({ timeout: 10_000 }).catch(() => {});
    }
    await page.goto('https://www.automationexercise.com/view_cart', { waitUntil: 'domcontentloaded' });
    return;
  }

  // continue
  if (await continueBtn.isVisible().catch(() => false)) {
    await continueBtn.click({ timeout: 10_000 }).catch(() => {});
    await expect(modal).toBeHidden({ timeout: 15_000 }).catch(() => {});
  } else {
    // fallback: click X if exists
    const closeX = modal.locator('button.close-modal, .modal-content button.close');
    if (await closeX.first().isVisible().catch(() => false)) {
      await closeX.first().click({ timeout: 10_000 }).catch(() => {});
    }
  }
}

async function safeWaitHome(page: Page) {
  await page.goto('https://www.automationexercise.com/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('a[href="/"]').first()).toBeVisible({ timeout: 20_000 });
}

async function attachScreenshot(testInfo: any, page: Page, name: string) {
  const filePath = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  testInfo.attachments.push({ name, path: filePath, contentType: 'image/png' });
  log(`📸 Screenshot saved: ${name}.png`);
}

// ===============================
// STEP 6 Helper - Add products (Home)
// ===============================
async function addProductFromHomeByCardIndex(page: Page, cardIndex: number, modalAction: 'continue' | 'viewCart') {
  // We prefer clicking the VISIBLE "Add to cart" inside .productinfo to avoid hover/overlay flakiness.
  const card = page.locator('.features_items .product-image-wrapper').nth(cardIndex);
  await card.scrollIntoViewIfNeeded();

  const addVisible = card.locator('.productinfo a.add-to-cart, .productinfo .add-to-cart').first();
  const addOverlay = card.locator('.product-overlay a.add-to-cart, .product-overlay a:has-text("Add to cart")').first();

  // Try visible add-to-cart first
  if (await addVisible.isVisible().catch(() => false)) {
    await addVisible.click({ timeout: 15_000 });
  } else {
    // Fallback: hover to show overlay, then click
    await card.hover().catch(() => {});
    await expect(addOverlay).toBeVisible({ timeout: 10_000 });
    await addOverlay.click({ timeout: 15_000 });
  }

  // Wait for modal and close it properly
  await expect(page.locator('#cartModal')).toBeVisible({ timeout: 20_000 });
  await closeCartModalIfVisible(page, modalAction);
}

// ===============================
// STEP 6 Helper - View Product -> change qty -> Add to cart
// ===============================
async function addProductViaViewProduct(page: Page, productId: number, quantity: number, modalAction: 'continue' | 'viewCart') {
  // You asked to follow the original flow:
  // <a href="/product_details/1">View Product</a> -> <input id="quantity"> -> Add to cart button (.cart)
  await page.goto(`https://www.automationexercise.com/product_details/${productId}`, { waitUntil: 'domcontentloaded' });

  // Sometimes google_vignette pops on navigation
  await closeGoogleVignetteIfPresent(page);

  const qty = page.locator('input#quantity[name="quantity"]');
  await expect(qty).toBeVisible({ timeout: 20_000 });
  await qty.fill(String(quantity));

  const addBtn = page.locator('button.btn.btn-default.cart:has-text("Add to cart")');
  await expect(addBtn).toBeVisible({ timeout: 20_000 });
  await addBtn.click({ timeout: 15_000 });

  await expect(page.locator('#cartModal')).toBeVisible({ timeout: 20_000 });
  await closeCartModalIfVisible(page, modalAction);
}

// ===============================
// STEP 7 Helper - Go to cart + proceed checkout
// ===============================
async function goToCartAndCheckout(page: Page) {
  await page.goto('https://www.automationexercise.com/view_cart', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('text=/Shopping Cart/i')).toBeVisible({ timeout: 20_000 });

  // Proceed to Checkout
  const proceed = page.locator('a:has-text("Proceed To Checkout"), a.check_out');
  await expect(proceed.first()).toBeVisible({ timeout: 20_000 });
  await proceed.first().click();

  await page.waitForLoadState('domcontentloaded');
  await closeGoogleVignetteIfPresent(page);

  // Checkout page usually has "Review Your Order"
  await expect(page.locator('text=/Review Your Order/i')).toBeVisible({ timeout: 25_000 });
}

// ===============================
// STEP 8 Helper - Payment
// ===============================
async function fillPaymentAndConfirm(page: Page, user: UserData) {
  // Place Order
  const message = page.locator('textarea[name="message"]');
  if (await message.isVisible().catch(() => false)) {
    await message.fill(`Urgent shipping - ${user.runId}`);
  }

  const placeOrder = page.locator('a:has-text("Place Order")');
  await expect(placeOrder).toBeVisible({ timeout: 20_000 });
  await placeOrder.click();

  await page.waitForLoadState('domcontentloaded');
  await closeGoogleVignetteIfPresent(page);

  // Instead of waiting for "Payment" text (can fail), wait for actual payment inputs
  const nameOnCard = page.locator('input[name="name_on_card"]');
  await expect(nameOnCard).toBeVisible({ timeout: 30_000 });

  await nameOnCard.fill(`${user.firstName} ${user.lastName}`);
  await page.locator('input[name="card_number"]').fill(`411111111111${Math.floor(1000 + Math.random() * 8999)}`);
  await page.locator('input[name="cvc"]').fill(`${Math.floor(100 + Math.random() * 899)}`);
  await page.locator('input[name="expiry_month"]').fill(`${Math.floor(1 + Math.random() * 12)}`.padStart(2, '0'));
  await page.locator('input[name="expiry_year"]').fill(`${1990 + Math.floor(Math.random() * 25)}`);

  const payBtn = page.locator('button:has-text("Pay and Confirm Order")');
  await expect(payBtn).toBeVisible({ timeout: 20_000 });
  await payBtn.click();

  await page.waitForLoadState('domcontentloaded');
  await closeGoogleVignetteIfPresent(page);

  // Order placed confirmation
  await expect(page.locator('text=/Order Placed!/i')).toBeVisible({ timeout: 30_000 });
}

// ===============================
// STEP 9 Helper - Review (random, same user)
// ===============================
async function submitRandomReview(page: Page, user: UserData) {
  // Go to a product page and submit review
  await page.goto('https://www.automationexercise.com/product_details/1', { waitUntil: 'domcontentloaded' });
  await closeGoogleVignetteIfPresent(page);

  const yourName = page.getByRole('textbox', { name: /Your Name/i });
  const yourEmail = page.getByRole('textbox', { name: /Email Address/i }).first();
  const reviewBox = page.getByRole('textbox', { name: /Add Review Here/i });

  await expect(yourName).toBeVisible({ timeout: 20_000 });
  await yourName.fill(user.firstName);

  await expect(yourEmail).toBeVisible({ timeout: 20_000 });
  await yourEmail.fill(user.email);

  await expect(reviewBox).toBeVisible({ timeout: 20_000 });
  const reviewText = `Run ${user.runId}: ⭐️${Math.floor(4 + Math.random() * 2)} - Great product, fast flow test.`;
  await reviewBox.fill(reviewText);

  const submit = page.getByRole('button', { name: /Submit/i });
  await submit.click();

  // Success message
  await expect(page.locator('text=/Thank you for your review/i')).toBeVisible({ timeout: 20_000 });
}

// ===============================
// MAIN TEST
// ===============================
test('AutomationExercise E2E: signup (random user) -> add to cart -> checkout (screenshots) -> pay -> review (random)', async ({ page }, testInfo) => {
  // STEP 1 - Build random user
  const user = buildRandomUser();
  log(`RunId=${user.runId}`);
  log(`Random user: ${user.name} | ${user.email}`);

  page.setDefaultTimeout(20_000);

  // STEP 2 - Open site home
  log('STEP 2 - Open home');
  await safeWaitHome(page);

  // STEP 3 - Open Signup / Login
  log('STEP 3 - Open Signup / Login');
  await page.getByRole('link', { name: /Signup \/ Login/i }).click();
  await expect(page.locator('text=/New User Signup!/i')).toBeVisible({ timeout: 20_000 });

  // STEP 4 - Fill Signup form (use data-qa to avoid strict violations)
  log('STEP 4 - Fill Signup form (data-qa)');
  await page.locator('input[data-qa="signup-name"]').fill(user.name);
  await page.locator('input[data-qa="signup-email"]').fill(user.email);
  await page.locator('button[data-qa="signup-button"]').click();

  // STEP 5 - Fill Account Information (data-qa / ids)
  log('STEP 5 - Fill Account Information (data-qa / ids)');
  await expect(page.locator('text=/Enter Account Information/i')).toBeVisible({ timeout: 25_000 });

  // Title
  await page.locator('#id_gender1').check().catch(async () => {
    await page.locator('#id_gender2').check();
  });

  // Password + DOB
  await page.locator('input[data-qa="password"], #password').fill(user.password);
  await page.locator('#days').selectOption(`${Math.floor(1 + Math.random() * 28)}`);
  await page.locator('#months').selectOption(`${Math.floor(1 + Math.random() * 12)}`);
  await page.locator('#years').selectOption(`${1980 + Math.floor(Math.random() * 25)}`);

  // Optional checkboxes (best-effort)
  await page.locator('#newsletter').check().catch(() => {});
  await page.locator('#optin').check().catch(() => {});

  // Required address fields (EXACT locators you provided)
  await page.locator('input[data-qa="first_name"], #first_name').fill(user.firstName);
  await page.locator('input[data-qa="last_name"], #last_name').fill(user.lastName);
  await page.locator('input[data-qa="company"], #company').fill(user.company);

  // IMPORTANT: Address strict fix -> use data-qa="address" (address1)
  await page.locator('input[data-qa="address"], #address1').fill(user.address);

  // Country select (you provided <select data-qa="country"...>)
  await page.locator('select[data-qa="country"], #country').selectOption(user.country);

  await page.locator('input[data-qa="state"], #state').fill(user.state);
  await page.locator('input[data-qa="city"], #city').fill(user.city);
  await page.locator('input[data-qa="zipcode"], #zipcode').fill(user.zipcode);
  await page.locator('input[data-qa="mobile_number"], #mobile_number').fill(user.mobile);

  // Create account
  await page.locator('button[data-qa="create-account"]').click();

  // Verify account created & continue
  log('STEP 6 - Verify account created & continue');
  await expect(page.locator('text=/Account Created!/i')).toBeVisible({ timeout: 25_000 });
  await page.locator('a[data-qa="continue-button"], a:has-text("Continue")').click();

  // STEP 6.1 - Ensure logged in (best-effort)
  await page.waitForLoadState('domcontentloaded');
  await closeGoogleVignetteIfPresent(page);

  // Sometimes an ad/modal appears. If we land on home - OK.
  await safeWaitHome(page);

  // STEP 7 - Add multiple products (handle modal each time)
  log('STEP 7 - Add multiple products (close modal each time)');

  // Add 1st product from home card
  log('STEP 7.1 - Add product from Home (card index 1)');
  await addProductFromHomeByCardIndex(page, 1, 'continue');

  // Add 2nd product from home card
  log('STEP 7.2 - Add product from Home (card index 4)');
  await addProductFromHomeByCardIndex(page, 4, 'continue');

  // Add via View Product flow (product_details/1)
  log('STEP 7.3 - View Product (id=1) -> set quantity -> Add to cart');
  await addProductViaViewProduct(page, 1, Math.floor(2 + Math.random() * 4), 'continue');

  // Add via View Product flow (product_details/2)
  log('STEP 7.4 - View Product (id=2) -> set quantity -> Add to cart');
  await addProductViaViewProduct(page, 2, Math.floor(3 + Math.random() * 5), 'continue');

  // Final add from home then go to cart
  log('STEP 7.5 - Add another product then View Cart');
  await safeWaitHome(page);
  await addProductFromHomeByCardIndex(page, 2, 'viewCart');

  // STEP 8 - Checkout (screenshots)
  log('STEP 8 - Proceed to checkout (screenshots)');
  await goToCartAndCheckout(page);

  // Screenshot #1: checkout summary (addresses + order table)
  await attachScreenshot(testInfo, page, `01-checkout-summary-${user.runId}`);

  // STEP 9 - Payment
  log('STEP 9 - Payment (screenshots + fill)');
  // Screenshot #2: still on checkout page (before Place Order) - optional
  await attachScreenshot(testInfo, page, `02-checkout-before-place-order-${user.runId}`);

  await fillPaymentAndConfirm(page, user);

  // Screenshot #3: order placed
  await attachScreenshot(testInfo, page, `03-order-placed-${user.runId}`);

  // Continue after order
  const continueAfterPay = page.locator('a:has-text("Continue")');
  if (await continueAfterPay.isVisible().catch(() => false)) {
    await continueAfterPay.click().catch(() => {});
    await page.waitForLoadState('domcontentloaded');
    await closeGoogleVignetteIfPresent(page);
  }

  // STEP 10 - Review (random, same user)
  log('STEP 10 - Submit review (random, same user)');
  await submitRandomReview(page, user);

  log('✅ TEST DONE - reached review submit successfully');
});