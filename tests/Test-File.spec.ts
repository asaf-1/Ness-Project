import { test } from '@playwright/test';
import { AutomationExercisePage } from '../src/pages/AutomationExercisePage';
import { buildRandomUser } from '../src/utils/randomUser';

test.setTimeout(240_000);

test('AutomationExercise E2E (Final): signup random -> add products -> checkout screenshots -> pay -> review', async ({ page }, testInfo) => {
  const ae = new AutomationExercisePage(page, testInfo);
  const user = buildRandomUser();

  ae.log(`RunId=${user.runId}`);
  ae.log(`Random user: ${user.name} | ${user.email}`);

  // STEP 1 - Home
  ae.log('STEP 1 - Open home');
  await ae.gotoHome();

  // STEP 2-6 - Signup
  ae.log('STEP 2 - Signup flow');
  await ae.signup(user);

  // STEP 7 - Add products (same logic you approved)
  ae.log('STEP 7.1 - Add product from Home (card index 1) -> Continue');
  await ae.gotoHome();
  await ae.addProductFromHomeByCardIndex(1, 'continue');

  ae.log('STEP 7.2 - Add product from Home (card index 4) -> Continue');
  await ae.gotoHome();
  await ae.addProductFromHomeByCardIndex(4, 'continue');

  ae.log('STEP 7.3 - View Product (id=1) -> set qty -> Add -> Continue');
  await ae.addProductViaViewProduct(1, Math.floor(2 + Math.random() * 4), 'continue');

  ae.log('STEP 7.4 - View Product (id=2) -> set qty -> Add -> Continue');
  await ae.addProductViaViewProduct(2, Math.floor(3 + Math.random() * 5), 'continue');

  // LAST ITEM: MUST CLICK VIEW CART in modal
  ae.log('STEP 7.5 - Add another product then View Cart (LAST ITEM)');
  await ae.gotoHome();
  await ae.addProductFromHomeByCardIndex(2, 'viewCart');

  // STEP 8 - Checkout + screenshots
  ae.log('STEP 8 - Checkout and screenshots');
  await ae.goToCartAndCheckout();
  await ae.screenshot(`01-checkout-summary-${user.runId}`);
  await ae.screenshot(`02-checkout-before-place-order-${user.runId}`);

  // STEP 9 - Payment + screenshot
  ae.log('STEP 9 - Payment');
  await ae.fillPaymentAndConfirm(user);
  await ae.screenshot(`03-order-placed-${user.runId}`);

  // Continue after pay (best-effort)
  const continueAfterPay = page.locator('a:has-text("Continue")');
  if (await continueAfterPay.isVisible().catch(() => false)) {
    await continueAfterPay.click().catch(() => {});
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await ae.closeGoogleVignetteIfPresent();
  }

  // STEP 10 - Review (same user, random text)
  ae.log('STEP 10 - Review');
  await ae.submitRandomReview(user);

  ae.log('✅ TEST DONE - reached review submit successfully');
});