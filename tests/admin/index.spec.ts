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

    await page.waitForTimeout(2000);

    // Fill email
    await page.getByRole('textbox', { name: 'Email address' }).waitFor({ state: 'visible' })
    await page.getByRole('textbox', { name: 'Email address' }).fill(EMAIL);

    await page.getByRole('textbox', { name: 'Password' }).fill(PASSWORD);

    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
 
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


async function viewPortsize(page: Page) {
    const viewportSize = page.setViewportSize({ width: 1920, height: 1080 })

    return viewportSize;
}


export { loginAsAdmin, EMAIL, PASSWORD, landingPage, devServerLandingPage, viewPortsize };