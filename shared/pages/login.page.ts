import { expect, Locator, Page } from "@playwright/test";


export class LoginPage {
    readonly page: Page;

    // Constants
    readonly STAGING_PAGE = 'https://staging.wyzquests.com/';
    readonly DEV_SERVER = 'http://72.60.42.114/';

    // 
    readonly navigationBar: Locator;
    readonly signInButton: Locator;

    readonly emailInput: Locator;
    readonly continueButton: Locator;

    readonly passwordInput: Locator;
    readonly passwordError: Locator;

    readonly dashboardHeader: Locator;

    readonly twoFactorInput: Locator;

    constructor(page: Page) {
        this.page = page;

        this.navigationBar = page.getByRole('navigation');
        this.signInButton = this.navigationBar.getByRole('button', { name: 'Sign In' });

        // Email Screen
        this.emailInput = page.locator('input[name="identifier"]');
        this.continueButton = page.getByRole('button', { name: 'Continue', exact: true });

        // Pasword Screen
        this.passwordInput = page.locator('input[type="password"]').first();
        this.passwordError = page.locator('#error-password');

        // Dashboard
        this.dashboardHeader = page.locator('h1, .dashboard-title, [data-testid="dashboard-title"]').first();

        // 2FA
        this.twoFactorInput = page.locator('input[name="code"], input[placeholder*="code"]').first();
    }

    /**
     * Navigate to landing page
     * 
     */

    async goto(): Promise<void> {
        await this.page.goto(this.STAGING_PAGE);
        await this.page.waitForLoadState('networkidle');
    }

    /**
     * Click Sign In button from landing page navigation
     * 
     */

    async clickSignIn(): Promise<void> {
        await this.signInButton.click();
        // Wait for the identifier/email input to appear
        await this.emailInput.waitFor({ state: 'visible', timeout: 10000 });
    }

    /**
     * Fill email address and click Continue
     */

    async fillEmail(emaiL: string): Promise<void> {
        await this.emailInput.fill(emaiL);
    }

    /**
     * Click Continue after entering email
     */

    async clickContinue(): Promise<void> {
        await this.continueButton.click();

        await this.passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    }

    /**
     * 
     * Fill password
     */

    async fillPassword(password: string): Promise<void> {
        await this.passwordInput.fill(password)
    }

    /**
     * Complete login flow: Landing → Email → Password
     */

    async login(email: string, password: string): Promise<void> {
        await this.clickSignIn();
        await this.fillEmail(email);
        await this.fillPassword(password);
        await this.clickContinue();
    }


    /**
     * Login with expected redirect to admin dashboard
     */

    async loginAsAdmin(email: string, password: string): Promise<void> {
        await this.login(email,password);
        await this.expectRedirectToAdmin()
    }

    /**
     * 
     * Clear cookies for fresh login
     */

    async clearSession(): Promise<void> {
        await this.page.context().clearCookies();
    }

    /**
     * Check if password error is visible
     */

    async isPasswordErrorVisible(): Promise<boolean> {
        return await this.passwordError.isVisible().catch(() => false);
    }

    /**
     * Check if redirected tp 2FA page
     */

    async isOnTwoFactorPage(): Promise<boolean> {
        return this.page.url().includes('factor-one');
    }

    /**
     * Check if email field is focused (for empty field validation)
     */
    async isEmailFieldFocused(): Promise<boolean> {
        return await this.emailInput.evaluate((el: HTMLInputElement) => document.activeElement === el)
    }


    // ASSERTIONS

    /**
     * expect redirect to admin dashboard
     */
    async expectRedirectToAdmin(): Promise<void> {
        await this.page.waitForURL(/\/admin/, { timeout: 15000 });
        await expect(this.page).toHaveURL(/\/admin/);
    }

    /**
     * Expect redirect to creator dashboard
     */

    async expectRedirectToCreator(): Promise<void> {
        await this.page.waitForURL
    }



    /**
     * Expect password error message
     */
    async expectPasswordError(): Promise<void> {
        await expect(this.passwordError).toBeVisible();
    }

    /**
     * Expect email field to be focused (validation)
     */
    async expectEmailFocused(): Promise<void> {
        await expect(this.emailInput).toBeFocused();
    }

    /**
     * Expect to stay on login page (failed login)
     */
    async expectStillOnLogin(): Promise<void> {
        await expect(this.emailInput).toBeVisible();
    }
}