/** Run against `npm run view:fixture -- --no-open --port 43213` after building. */
import {chromium,expect} from '@playwright/test'
import {mkdir} from 'node:fs/promises'
import {resolve} from 'node:path'
const origin=process.argv[2]||'http://127.0.0.1:43213'
const output=process.env.BLR_VARIATION_SCREENSHOTS
if(output)await mkdir(output,{recursive:true})
const cases=[
 {id:'entities',url:'?s=entity',sample:['entities','cart'],key:'entity:cart'},
 {id:'capabilities',url:'?s=capability',sample:['capabilities','cancel-order'],key:'capability:cancel-order'},
 {id:'journeys',url:'?s=journey',sample:['journeys','browse-and-buy'],key:'journey:browse-and-buy'},
 {id:'rules',url:'?s=rule',key:'rule:refund-review-standard'},
 {id:'attached',url:'?s=capability&e=capability:manage-orders&rt=rules',key:'rule:refund-review-standard',dialog:true}
]
const browser=await chromium.launch({headless:true}),errors=[]
try{
 for(const c of cases){
  const context=await browser.newContext({viewport:{width:1120,height:1000},deviceScaleFactor:2,reducedMotion:'reduce'})
  // Only these three contexts need synthetic variation metadata to exercise
  // the existing card renderer. The fixture on disk is never changed.
  if(c.sample)await context.route('**/_businesslens/report.json',async route=>{
   const response=await route.fetch(),report=await response.json()
   const [collection,id]=c.sample,anchor=report.model[collection].find(r=>r.id===id)
   anchor.variationKind='version'
   anchor.variationUsage={label:'v1',selectedWhen:'Preview v1 selection.',takesEffect:'At the start of the operation.',stability:'Fixed for this operation.'}
   report.model[collection].push({...structuredClone(anchor),id:id+'-preview-variant',title:anchor.title+' — preview alternative',variantOfId:id,variationKind:null,variationUsage:{...anchor.variationUsage,label:'v2'}})
   report.counts[collection]+=1;await route.fulfill({response,json:report})
  })
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message))
  await page.goto(origin+'/'+c.url)
  if(c.dialog)await page.getByRole('button',{name:'Expand resource',exact:true}).click()
  const scope=c.dialog?page.getByRole('dialog'):page
  const card=scope.locator(`.blr-resource-row[data-resource-key="${c.key}"]`)
  async function reading(tab){
   await expect(page.getByRole('tab',{name:tab==='variations'?'Variations 2':'Overview',exact:true})).toHaveAttribute('aria-selected','true')
   await expect.poll(()=>new URL(page.url()).searchParams.get('e')).toBe(c.key)
   await expect.poll(()=>new URL(page.url()).searchParams.get('rt')||'overview').toBe(tab)
  }
  async function backToCard(){
   await page.goBack()
   if(c.dialog)await expect(page.getByRole('tab',{name:'Business Rules 7',exact:true})).toHaveAttribute('aria-selected','true')
   else await expect(page.getByRole('dialog')).not.toBeVisible()
   await expect(card).toBeVisible()
  }
  await expect(card).toBeVisible()
  const primary=card.locator('[data-card-primary]'),variation=card.getByRole('link',{name:'View 2 variations',exact:true})
  await expect(primary).toHaveAttribute('href',/e=/)
  await expect(variation).toHaveAttribute('href',/rt=variations/)
  expect(await card.locator('a a,button a,a button,button button').count()).toBe(0)
  expect(await card.evaluate(row=>{
   const cardRect=row.getBoundingClientRect(),sub=row.querySelector('[data-variation-link]').getBoundingClientRect()
   const description=row.querySelector('.leading-5')?.getBoundingClientRect()
   return sub.left>=cardRect.left&&sub.right<=cardRect.right&&sub.top>cardRect.top&&sub.bottom<cardRect.bottom&&(!description||sub.bottom<=description.top)
  })).toBe(true)
  if(c.key.startsWith('rule:'))await expect(card.locator('[data-variation-link] [data-conditional-rule]')).toHaveText('· Applies conditionally')
  if(output)await card.screenshot({path:resolve(output,c.id+'-desktop.png'),animations:'disabled'})
  await primary.focus();await page.keyboard.press('Tab');await expect(variation).toBeFocused()
  await page.keyboard.press('Enter');await reading('variations')
  await backToCard()
  await primary.focus();await page.keyboard.press('Enter');await reading('overview')
  await backToCard()
  // Clicking ordinary card space continues to open Overview.
  await card.click({position:{x:8,y:8}});await reading('overview')
  await backToCard()
  // Native modifier clicks must not be swallowed by the card's click handler.
  const popupPromise=context.waitForEvent('page');await primary.click({modifiers:[process.platform==='darwin'?'Meta':'Control']});const popup=await popupPromise
  await expect(popup).toHaveURL(/e=/);expect(popup.url()).not.toContain('rt=variations');await popup.close()
  await page.setViewportSize({width:390,height:844})
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  expect(await card.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true)
  if(output)await card.screenshot({path:resolve(output,c.id+'-mobile.png'),animations:'disabled'})
  await variation.click();await expect(page.getByRole('tab',{name:'Variations 2',exact:true})).toHaveAttribute('aria-selected','true')
  await context.close();console.log(c.id+': subtitle, keyboard, card click, native link, Back and mobile passed.')
 }
 expect(errors).toEqual([])
}finally{await browser.close()}
