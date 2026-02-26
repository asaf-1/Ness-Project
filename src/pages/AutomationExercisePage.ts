import { expect, Page, TestInfo } from '@playwright/test';

export type UserData = {
  runId: string;
  name: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company: string;
  address: string;
  country: string;
  state: string;
  city: string;
  zipcode: string;
  mobile: string;
};

export class AutomationExercisePage {
  constructor(private page: Page, private testInfo: TestInfo) {}

  log(msg: string) {
    console.log(`[LOG] ${msg}`);
  }

  // STEP A - Close Ads / Overlays (Google vignette)
  async closeGoogleVignetteIfPresent() {
    const url = this.page.url();
    if (!/google_vignette/i.test(url) && !(await this.page.locator('#dismiss-button').isVisible().catch(() => false)))
      return;

    this.log('⚠️ Google vignette/ad detected. Trying to close (#dismiss-button)...');

    const tryClick = async (locatorStr: string) => {
      const loc = this.page.locator(locatorStr).first();
      if (await loc.isVisible().catch(() => false)) {
        await loc.click({ timeout: 5_000 }).catch(() => {});
        await this.page.waitForLoadState('domcontentloaded').catch(() => {});
        return true;
      }
      return false;
    };

    // Try main page
    if (await tryClick('#dismiss-button, [id="dismiss-button"]')) return;

    // Try frames
    for (const frame of this.page.frames()) {
      const btn = frame.locator('#dismiss-button, [id="dismiss-button"]').first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click({ timeout: 5_000 }).catch(() => {});
        await this.page.waitForLoadState('domcontentloaded').catch(() => {});
        return;
      }
    }

    // Fallback generic close
    await tryClick('[aria-label*="Close ad" i], [aria-label="Close" i], button:has-text("Close")');

    // If still stuck on hash, try reloading without hash
    if (/google_vignette/i.test(this.page.url())) {
      const clean = this.page.url().replace(/#.*$/g, '');
      await this.page.goto(clean, { waitUntil: 'domcontentloaded' }).catch(() => {});
    }
  }

  // STEP A - Cart modal handler
  async closeCartModalIfVisible(action: 'continue' | 'viewCart') {
    const modal = this.page.locator('#cartModal');
    const isOpen = await modal.isVisible().catch(() => false);
    if (!isOpen) return;

    const continueBtn = modal.locator('button.btn.btn-success.close-modal.btn-block:has-text("Continue Shopping")');
    const viewCartLink = modal.locator('p.text-center a[href="/view_cart"], a:has-text("View Cart")');

    if (action === 'viewCart') {
      if (await viewCartLink.isVisible().catch(() => false)) {
        await viewCartLink.click({ timeout: 10_000 });
        await this.page.waitForLoadState('domcontentloaded');
        return;
      }
      if (await continueBtn.isVisible().catch(() => false)) {
        await continueBtn.click({ timeout: 10_000 }).catch(() => {});
      }
      await this.page.goto('/view_cart', { waitUntil: 'domcontentloaded' });
      return;
    }

    if (await continueBtn.isVisible().catch(() => false)) {
      await continueBtn.click({ timeout: 10_000 }).catch(() => {});
      await expect(modal).toBeHidden({ timeout: 15_000 }).catch(() => {});
      return;
    }

    // fallback close X
    const closeX = modal.locator('button.close-modal, .modal-content button.close');
    if (await closeX.first().isVisible().catch(() => false)) {
      await closeX.first().click({ timeout: 10_000 }).catch(() => {});
      await expect(modal).toBeHidden({ timeout: 15_000 }).catch(() => {});
    }
  }

  async screenshot(name: string) {
    const filePath = this.testInfo.outputPath(`${name}.png`);
    await this.page.screenshot({ path: filePath, fullPage: true });
    await this.testInfo.attach(name, { path: filePath, contentType: 'image/png' });
    this.log(`📸 Screenshot saved: ${name}.png`);
  }

  async gotoHome() {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.closeGoogleVignetteIfPresent();
    await expect(this.page.locator('a[href="/"]').first()).toBeVisible({ timeout: 20_000 });
  }

  // Signup flow
  async signup(user: UserData) {
    this.log('STEP 3 - Open Signup / Login');
    await this.page.getByRole('link', { name: /Signup \/ Login/i }).click();
    await expect(this.page.locator('text=/New User Signup!/i')).toBeVisible();

    this.log('STEP 4 - Fill Signup form (data-qa)');
    await this.page.locator('input[data-qa="signup-name"]').fill(user.name);
    await this.page.locator('input[data-qa="signup-email"]').fill(user.email);
    await this.page.locator('button[data-qa="signup-button"]').click();

    this.log('STEP 5 - Fill Account Information (data-qa / ids)');
    await expect(this.page.locator('text=/Enter Account Information/i')).toBeVisible({ timeout: 25_000 });

    // Title
    await this.page.locator('#id_gender1').check().catch(async () => this.page.locator('#id_gender2').check());

    // Password + DOB
    await this.page.locator('input[data-qa="password"], #password').fill(user.password);
    await this.page.locator('#days').selectOption(`${Math.floor(1 + Math.random() * 28)}`);
    await this.page.locator('#months').selectOption(`${Math.floor(1 + Math.random() * 12)}`);
    await this.page.locator('#years').selectOption(`${1980 + Math.floor(Math.random() * 25)}`);

    // Optional
    await this.page.locator('#newsletter').check().catch(() => {});
    await this.page.locator('#optin').check().catch(() => {});

    // Required (data-qa)
    await this.page.locator('input[data-qa="first_name"], #first_name').fill(user.firstName);
    await this.page.locator('input[data-qa="last_name"], #last_name').fill(user.lastName);
    await this.page.locator('input[data-qa="company"], #company').fill(user.company);
    await this.page.locator('input[data-qa="address"], #address1').fill(user.address);
    await this.page.locator('select[data-qa="country"], #country').selectOption(user.country);
    await this.page.locator('input[data-qa="state"], #state').fill(user.state);
    await this.page.locator('input[data-qa="city"], #city').fill(user.city);
    await this.page.locator('input[data-qa="zipcode"], #zipcode').fill(user.zipcode);
    await this.page.locator('input[data-qa="mobile_number"], #mobile_number').fill(user.mobile);

    await this.page.locator('button[data-qa="create-account"]').click();

    this.log('STEP 6 - Verify account created & continue');
    await expect(this.page.locator('text=/Account Created!/i')).toBeVisible({ timeout: 25_000 });
    await this.page.locator('a[data-qa="continue-button"], a:has-text("Continue")').click();

    await this.page.waitForLoadState('domcontentloaded');
    await this.closeGoogleVignetteIfPresent();
    await this.gotoHome();
  }

  // Add from home card index
  async addProductFromHomeByCardIndex(cardIndex: number, modalAction: 'continue' | 'viewCart') {
    // Safety: if modal is open from previous action
    await this.closeCartModalIfVisible('continue');

    const card = this.page.locator('.features_items .product-image-wrapper').nth(cardIndex);
    await card.scrollIntoViewIfNeeded();

    const addVisible = card.locator('.productinfo a.add-to-cart, .productinfo .add-to-cart').first();
    const addOverlay = card.locator('.product-overlay a.add-to-cart, .product-overlay a:has-text("Add to cart")').first();

    if (await addVisible.isVisible().catch(() => false)) {
      await addVisible.click({ timeout: 15_000 });
    } else {
      await card.hover().catch(() => {});
      await expect(addOverlay).toBeVisible({ timeout: 10_000 });
      await addOverlay.click({ timeout: 15_000 });
    }

    await expect(this.page.locator('#cartModal')).toBeVisible({ timeout: 20_000 });
    await this.closeCartModalIfVisible(modalAction);
  }

  // View product -> set quantity -> add to cart
  async addProductViaViewProduct(productId: number, quantity: number, modalAction: 'continue' | 'viewCart') {
    await this.page.goto(`/product_details/${productId}`, { waitUntil: 'domcontentloaded' });
    await this.closeGoogleVignetteIfPresent();

    const qty = this.page.locator('input#quantity[name="quantity"]');
    await expect(qty).toBeVisible({ timeout: 20_000 });
    await qty.fill(String(quantity));

    const addBtn = this.page.locator('button.btn.btn-default.cart:has-text("Add to cart")');
    await expect(addBtn).toBeVisible({ timeout: 20_000 });
    await addBtn.click({ timeout: 15_000 });

    await expect(this.page.locator('#cartModal')).toBeVisible({ timeout: 20_000 });
    await this.closeCartModalIfVisible(modalAction);
  }

  async goToCartAndCheckout() {
    await this.page.goto('/view_cart', { waitUntil: 'domcontentloaded' });
    await expect(this.page.locator('text=/Shopping Cart/i')).toBeVisible({ timeout: 20_000 });

    const proceed = this.page.locator('a:has-text("Proceed To Checkout"), a.check_out');
    await expect(proceed.first()).toBeVisible({ timeout: 20_000 });
    await proceed.first().click();

    await this.page.waitForLoadState('domcontentloaded');
    await this.closeGoogleVignetteIfPresent();

    await expect(this.page.locator('text=/Review Your Order/i')).toBeVisible({ timeout: 25_000 });
  }

  async fillPaymentAndConfirm(user: UserData) {
    const message = this.page.locator('textarea[name="message"]');
    if (await message.isVisible().catch(() => false)) {
      await message.fill(`Urgent shipping - ${user.runId}`);
    }

    const placeOrder = this.page.locator('a:has-text("Place Order")');
    await expect(placeOrder).toBeVisible({ timeout: 20_000 });
    await placeOrder.click();

    await this.page.waitForLoadState('domcontentloaded');
    await this.closeGoogleVignetteIfPresent();

    // Wait for payment inputs (instead of text "Payment")
    const nameOnCard = this.page.locator('input[name="name_on_card"]');
    await expect(nameOnCard).toBeVisible({ timeout: 30_000 });

    await nameOnCard.fill(`${user.firstName} ${user.lastName}`);
    await this.page.locator('input[name="card_number"]').fill(`411111111111${Math.floor(1000 + Math.random() * 8999)}`);
    await this.page.locator('input[name="cvc"]').fill(`${Math.floor(100 + Math.random() * 899)}`);
    await this.page.locator('input[name="expiry_month"]').fill(`${Math.floor(1 + Math.random() * 12)}`.padStart(2, '0'));
    await this.page.locator('input[name="expiry_year"]').fill(`${1990 + Math.floor(Math.random() * 25)}`);

    const payBtn = this.page.locator('button:has-text("Pay and Confirm Order")');
    await expect(payBtn).toBeVisible({ timeout: 20_000 });
    await payBtn.click();

    await this.page.waitForLoadState('domcontentloaded');
    await this.closeGoogleVignetteIfPresent();

    await expect(this.page.locator('text=/Order Placed!/i')).toBeVisible({ timeout: 30_000 });
  }

  async submitRandomReview(user: UserData) {
    await this.page.goto('/product_details/1', { waitUntil: 'domcontentloaded' });
    await this.closeGoogleVignetteIfPresent();

    const yourName = this.page.getByRole('textbox', { name: /Your Name/i });
    const yourEmail = this.page.getByRole('textbox', { name: /Email Address/i }).first();
    const reviewBox = this.page.getByRole('textbox', { name: /Add Review Here/i });

    await expect(yourName).toBeVisible();
    await yourName.fill(user.firstName);

    await expect(yourEmail).toBeVisible();
    await yourEmail.fill(user.email);

    await expect(reviewBox).toBeVisible();
    const reviewText = `Run ${user.runId}: ⭐️${Math.floor(4 + Math.random() * 2)} - Great product, fast flow test.`;
    await reviewBox.fill(reviewText);

    await this.page.getByRole('button', { name: /Submit/i }).click();
    await expect(this.page.locator('text=/Thank you for your review/i')).toBeVisible({ timeout: 20_000 });
  }
}