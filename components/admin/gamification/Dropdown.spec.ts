import { Page } from "@playwright/test";

interface DropdownProps {
    page: Page;
    index?: number;
}

async function dropdown({
    page,
    index = 1,
}: DropdownProps) {

    await page.getByRole('combobox').click();

    await page.locator('selector').selectOption({ index });



    
}