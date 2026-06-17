import { test, expect, BrowserContext, Page } from '@playwright/test'
import { get } from 'http';

const EMAIL = "wyzquestbuilder@gmail.com";
const PASSWORD = "WyzQuests2025!"


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


// ============================================================
// QA-070: Admin switches user role
// ============================================================
test('QA-070: Admin switches user role', async ({ page }) => {
  const loggedIn = await loginAsAdmin(page)
  
  if (!loggedIn) {
    console.log('⚠️ QA-070 SKIPPED: Could not login (2FA required)')
    return
  }

  // Navigate to Manage Users
  await page.getByRole('link', { name: 'Manage Users' }).click()
  await page.waitForTimeout(2000)


  const combobox = page.getByRole('row', { name: 'C Clyde Ador ID: cbfcf799...' }).getByRole('combobox')

  const currentRole = await combobox.textContent()
  console.log('Current role:', currentRole)


  await page.getByRole('row', { name: 'C Clyde Ador ID: cbfcf799...' }).getByRole('combobox').click();


  await function changeRole(role: string) {
    let rolehandler = '';

    while (rolehandler === role) {
      const appliedRole = arr[Math.floor(Math.random() * arr.length)];
      rolehandler = appliedRole;
      console.log(appliedRole)
    }

    return rolehandler;
  }

  const newRole = (role: string) => {
    let rolehandler = currentRole;

    while (rolehandler === role) {
      const appliedRole = arr[Math.floor(Math.random() * arr.length)];
      rolehandler = appliedRole;
      console.log(appliedRole)
    }

    return rolehandler;
  }


  await page.getByRole('option', { name: newRole(currentRole!) || "" }).click();

  await page.getByRole('textbox', { name: 'Admin Password' }).fill(PASSWORD)

  await page.getByRole('button', { name: 'Verify' }).click();
  await page.waitForTimeout(1000);
  await page.getByText('User role updated successfully').isVisible();
  
})


// ============================================================
// QA-073.1: Verify Delete User modal is displayed
// ============================================================
test('QA-073.1: Delete User modal displayed', async ({ page }) => {
  const loggedIn = await loginAsAdmin(page)
  if (!loggedIn) {
    console.log('⚠️ QA-073.1 SKIPPED: Could not login')
    return  
  }

  // Navigate to Manage Users
  await page.getByRole('link', { name: 'Manage Users' }).click()
  await page.waitForTimeout(2000)

  await page.pause()
  const locateOptionButton = page.getByRole('row', { name: 'C Clyde Ador ID: cbfcf799...' }).locator('[data-slot="dropdown-menu-trigger"]'); // the value of locator is changing so what should I do?


  if (!locateOptionButton) {
    console.log('User not found');
    return;
  }

  await locateOptionButton.click();


  
  await page.waitForTimeout(500);
  
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.pause();

  await page.getByRole('heading', { name: 'Confirm Identity' }).waitFor({ state: 'visible', timeout: 2000 })

})




// ============================================================
// QA-073.2: Deletion blocked when confirmation text is blank
// ============================================================
test('QA-073.2: Deletion blocked - blank confirmation', async ({ page }) => {
    const loggedIn = await loginAsAdmin(page);
    if (!loggedIn) {
        console.log('⚠️ QA-073.2 SKIPPED: Could not login')
        return
    }
    // Navigate to Manage Users
    await page.getByRole('link', { name: 'Manage Users' }).click()
    await page.waitForTimeout(2000)

    await page.pause()
    const locateOptionButton = page.getByRole('row', { name: 'C Clyde Ador ID: b29a4756...' }).locator('[data-slot="dropdown-menu-trigger"]'); // the value of locator is changing so what should I do?


    if (!locateOptionButton) {
        console.log('User not found');
        return;
    }

    await locateOptionButton.click();
    
    await page.waitForTimeout(500);
    
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.pause();

    await page.getByRole('heading', { name: 'Confirm Identity' }).waitFor({ state: 'visible', timeout: 2000 })
    
    await page.pause();

    await page.getByRole('textbox', { name: 'Admin Password' }).fill(PASSWORD)

    await page.getByRole('button', { name: "Verify" }).click();   

})


test('QA-073.3: Deletion blocked - incorrect confirmation', async ({ page }) => {
    const loggedIn = await loginAsAdmin(page);
    if (!loggedIn) {
        console.log('Could not login')
        return
    }

    await page.getByRole( 'link', { name: 'Manage Users' }).click()
    await page.waitForTimeout(1000)

    await page.pause()
    const locateOptionButton = page.getByRole('row', { name: 'C Clyde Ador ID: b29a4756...' }).locator('[data-slot="dropdown-menu-trigger"]');

    if(!locateOptionButton) {
        return
    }

    await locateOptionButton.click();


    await page.waitForTimeout(500);

    await page.getByRole('menuitem', { name: 'Delete' }).click()
    await page.getByRole('heading', { name: 'Confirm Identity' }).waitFor({ state: 'visible', timeout: 2000 })

    await expect(page.getByRole('button', { name: 'Verify' })).toBeDisabled();
})