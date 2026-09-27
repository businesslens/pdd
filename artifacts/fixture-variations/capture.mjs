import { chromium, expect } from '@playwright/test'
const browser=await chromium.launch({headless:true})
const errors=[]
try {
 for(const [name,key,count,type,fields] of [
 ['experiment','screen:customer-web::storefront::product-record',5,'Experiment',['Assignment unit','Assignment fact','Assignment method','Allocation']],
 ['configuration','rule:refund-review-standard',2,'Configuration',['Setting','Refund review mode','Refund approval threshold']],
 ['version','interface:payment-webhook',2,'Version',['Version discriminator','Settlement contract','v1']]
 ]) {
  const context=await browser.newContext({viewport:{width:1120,height:900},deviceScaleFactor:2,reducedMotion:'reduce'})
  const page=await context.newPage()
  page.on('pageerror',e=>errors.push(e.message))
  await page.goto(`http://127.0.0.1:43213/?s=${name==='configuration'?'rule':'interface'}&e=${encodeURIComponent(key)}&rt=variations`)
  await expect(page.getByRole('tab',{name:`Variations ${count}`,exact:true})).toHaveAttribute('aria-selected','true')
  await page.getByRole('button',{name:'Expand resource',exact:true}).click()
  const variations=page.locator('[data-variations]')
  await expect(variations).toContainText(type)
  await expect(page.locator('[data-variation-member]')).toHaveCount(count)
  for(const field of [...fields,'Selected when','Takes effect','Stability'])await expect(variations).toContainText(field)
  await page.screenshot({path:`artifacts/fixture-variations/${name}.png`,animations:'disabled'})
  await page.setViewportSize({width:390,height:844})
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  await page.screenshot({path:`artifacts/fixture-variations/${name}-mobile.png`,animations:'disabled'})
  await context.close()
 }
 expect(errors).toEqual([])
 console.log('Actual Fixture Shop: all three types, all fields, member counts, desktop and mobile passed.')
} finally {await browser.close()}
