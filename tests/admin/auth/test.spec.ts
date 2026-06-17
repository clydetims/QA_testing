import { test, expect } from '@playwright/test';

const EMAIL = "wyzquestbuilder@gmail.com";
const PASSWORD = "WyzQuests2025!"


const landingPage = "https://staging.wyzquests.com/";
const devServerLandingPage = "http://72.60.42.114/"
const NavigationSignIn = {role: 'navigation', name: 'Sign In'};


const EXISTING_EMAIL = 'wyzquestbuilder@gmail.com'
const TEST_PASSWORD = 'Test@Pass123!Secure' // Stronger password
const UNREGISTERED_EMAIL = `noexist${Date.now()}@example.com`





