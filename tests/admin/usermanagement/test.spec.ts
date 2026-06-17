import { test, expect, BrowserContext, Page } from '@playwright/test'
// import { get } from 'http';
import MailosaurClient from 'mailosaur';

const EMAIL = "wyzquestbuilder@gmail.com";
const PASSWORD = "WyzQuests2025!"
const testingEmail = "anything@jtudkutp.mailosaur.net"


/**
 * For Sign Up usage
 */

const first_name = "Example"
const last_name = 'Account'
// const 
// const mailosaur = new MailosaurClient(
//     process.env.MAILOSAUR_API_KEY!
// );
// const serverId = process.env.MAILOSAUR_SERVER_ID!;

// const email = mailosaur.servers.generateEmailAddress(
//     process.env.MAILOSAUR_SERVER_ID!
// )



const landingPage = "https://staging.wyzquests.com/";
const devServerLandingPage = "http://72.60.42.114/"

const arr = ["ADMIN", "LEARNER", "CREATOR", "REVIEWER", "AGENCY (legacy)"]


async function loginAsAdmin(page: Page) {
    await page.goto(landingPage)

    // Click Sign In 
    await page.getByRole('navigation').getByRole('button', {name: 'Sign In' }).click();
    await page.waitForSelector('input[name="identifier"]', { timeout: 10000 })

 
    // Fill email
    await page.locator('input[name="identifier"]').fill(EMAIL);
    await page.getByRole('button', { name: 'Continue', exact: true }).click()

    // FIll with Password
    await page.waitForSelector('input[type="password"]', { timeout: 10000 })
    await page.locator('input[type="password"]').first().fill(PASSWORD)
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
 
    // Wait for redirect
    await page.waitForTimeout(5000)

    const url = page.url()
    
    // If 2FA appears, we can't proceed automatically
    if (url.includes('factor-one')) {
        console.log('⚠️ 2FA required - cannot automate further')
        return false
    }
    
    // Should be on admin dashboard
    if (url.includes('/admin')) {
        console.log('✅ Logged in as admin')
        return true
    }
    
    return false

}

async function SignUp(page: Page) {
    await page.goto(landingPage);
    await page.getByRole('link', { name: 'Sign Up' }).click();
    await page.waitForTimeout(2000);

    await page.getByRole('textbox', { name: 'First name' }).fill(first_name);
    await page.getByRole('textbox', { name: 'Last name' }).fill(last_name);

    await page.getByRole('textbox', { name: 'Email address' }).fill(email)
    await page.getByRole('textbox', { name: 'Password' }).fill('StrongPassword123@');

    await page.getByRole('button', { name: 'Continue', exact: true }).click();

    
    await page.waitForTimeout(2000);

    // Verify you are human
    // How to Bypass this 
    //import { test, expect } from '@playwright/test';


    //   await page.locator('iframe[src="https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/g/turnstile/f/ov2/av0/rch/18olz/0x4AAAAAAAWXJGBD7bONzLBd/auto/fbE/new/normal?lang=en-us"]').contentFrame().locator('body').click();
    //   await page.locator('iframe[src="https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/g/turnstile/f/ov2/av0/rchLw0Fpjoz.7E7KhUtx77q5TGbCOW4Lz91VdEPyF0168g-1780933131-1.3.1.1-QlGyk36_joefQySzQdtx4EEMlluIhcg6.HOnM_DvdM4/18olz/0x4AAAAAAAWXJGBD7bONzLBd/auto/fbE/api/normal?lang=en-us"]').contentFrame().locator('body').click();


}


async function DeleteUser(page: Page) {
    const loggedIn = await loginAsAdmin(page);
    if (!loggedIn) {
        console.log('Could not login')
        return
    }
}





test('QA-073.7' , async ({ page }) => {
    await page.goto(landingPage);
    await page.getByRole('link', { name: 'Sign Up' }).click();
    await page.waitForTimeout(2000);
    await page.pause();

})