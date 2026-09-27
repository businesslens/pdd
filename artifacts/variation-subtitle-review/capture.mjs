import {chromium,expect} from '@playwright/test'
import {writeFileSync} from 'node:fs'
const cases=[
{id:'entities',title:'Entities collection',kind:'move',url:'?s=entity',sample:['entities','cart'],key:'entity:cart'},
{id:'capabilities',title:'Capabilities collection',kind:'move',url:'?s=capability',sample:['capabilities','cancel-order'],key:'capability:cancel-order'},
{id:'journeys',title:'Journeys collection',kind:'move',url:'?s=journey',sample:['journeys','browse-and-buy'],key:'journey:browse-and-buy'},
{id:'rules',title:'Business Rules collection',kind:'move',url:'?s=rule',key:'rule:refund-review-standard'},
{id:'attached',title:'A resource’s Business Rules tab',kind:'move',url:'?s=capability&e=capability:manage-orders&rt=rules',key:'rule:refund-review-standard',dialog:true},
{id:'also-on',title:'Overview → Also on',kind:'hide',url:'?s=interface&e=screen:customer-mobile::storefront::product-record',key:'screen:customer-web::storefront::product-record',dialog:true},
{id:'interfaces',title:'Interfaces collection tree',kind:'tree',url:'?s=interface',target:'[data-card-key="interface:payment-webhook"]'},
{id:'domains',title:'Domains collection tree',kind:'tree',url:'?s=domain',sample:['entities','cart'],target:'[data-card-key="domain:ordering"]'},
{id:'delivery',title:'Resource → Delivery tree',kind:'tree',url:'?s=interface&e=experience:customer-web::storefront&rt=delivery',target:'[data-resource-structure]',dialog:true},
{id:'applies-to',title:'Business Rule → Applies to tree',kind:'hide',url:'?s=rule&e=rule:a-refund-is-visible-to-its-shopper&rt=applies-to',sample:['entities','refund'],target:'[data-rule-scope]',dialog:true},
{id:'overview',title:'Resource → Overview → When used',kind:'keep',url:'?s=rule&e=rule:refund-review-standard',target:'[data-when-used]',dialog:true},
{id:'tab',title:'Resource tab bar',kind:'keep',url:'?s=rule&e=rule:refund-review-standard&rt=variations',target:'[role="tablist"]',dialog:true},
{id:'variation-set',title:'Inside the Variations tab',kind:'keep',url:'?s=rule&e=rule:refund-review-standard&rt=variations',target:'[data-variations]',dialog:true}
]
const browser=await chromium.launch({headless:true})
try{
 for(const c of cases.filter(item=>item.kind==='move')){
  const context=await browser.newContext({viewport:{width:1120,height:1100},deviceScaleFactor:2,reducedMotion:'reduce'})
  if(c.sample)await context.route('**/_businesslens/report.json',async route=>{
   const response=await route.fetch(),report=await response.json()
   const [collection,id]=c.sample,anchor=report.model[collection].find(r=>r.id===id)
   anchor.variationKind='version'
   anchor.variationUsage={label:'v1',selectedWhen:'Preview-only layout example: the v1 form is selected.',takesEffect:'At the start of each operation.',stability:'Fixed for that operation.'}
   const peer={...structuredClone(anchor),id:id+'-preview-variant',title:(anchor.title??id)+' — preview alternative',variantOfId:id,variationKind:null,variationUsage:{...anchor.variationUsage,label:'v2'}}
   report.model[collection].push(peer);report.counts[collection]+=1
   await route.fulfill({response,json:report})
  })
  const page=await context.newPage();await page.goto('http://127.0.0.1:43213/'+c.url)
  if(c.dialog){const expand=page.getByRole('button',{name:'Expand resource',exact:true});await expect(expand).toBeVisible();await expand.click()}
  else {const density=page.getByRole('combobox',{name:'Rows per line'});if(await density.count()){await density.click();await page.getByRole('option',{name:'1 per row',exact:true}).click()}}
  const scope=c.dialog?page.getByRole('dialog'):page
  let target=c.target?scope.locator(c.target).first():scope.locator(`.blr-resource-row[data-resource-key="${c.key}"]`).locator('..')
  await expect(target).toBeVisible()
  if(c.id==='domains'){
   const expand=target.getByRole('button',{name:/^Expand Entities/});if(await expand.count())await expand.click()
  }
  if(c.kind!=='keep')await expect(target.locator('[data-variation-link]').first()).toBeVisible()
  await target.screenshot({path:`artifacts/variation-subtitle-review/${c.id}-current.png`,animations:'disabled'})
  if(c.kind==='move')await target.evaluate(root=>{
   let row=root.querySelector('.blr-resource-row');const link=root.querySelector('[data-variation-link]')
   // Temporary visual prototype: remove the outer anchor before placing a
   // separate link within the card. Production interaction is not changed.
   const frame=document.createElement('div');for(const attr of row.attributes)if(!['href','type','aria-label'].includes(attr.name))frame.setAttribute(attr.name,attr.value)
   while(row.firstChild)frame.appendChild(row.firstChild);row.replaceWith(frame);row=frame
   const text=row.firstElementChild.lastElementChild,title=text.firstElementChild
   title.after(link);Object.assign(link.style,{padding:'0',marginTop:'3px',marginBottom:'4px'})
   const action=link.querySelector('a');action.textContent='View '+action.textContent.trim()
   const conditional=text.querySelector('[data-conditional-rule]')
   if(conditional){const separator=document.createElement('span');separator.textContent='·';link.append(separator);const label=document.createElement('span');label.textContent=conditional.textContent.trim();link.append(label);conditional.remove()}
  })
  if(c.kind==='tree')await target.evaluate(root=>root.querySelectorAll('[data-variation-link] a').forEach(a=>{a.textContent='View '+a.textContent.trim()}))
  if(c.kind==='hide')await target.evaluate(root=>root.querySelectorAll('[data-variation-link]').forEach(el=>el.remove()))
  await target.screenshot({path:`artifacts/variation-subtitle-review/${c.id}-proposed.png`,animations:'disabled'})
  if(['capabilities','attached'].includes(c.id)){await page.setViewportSize({width:390,height:844});await target.screenshot({path:`artifacts/variation-subtitle-review/${c.id}-mobile.png`,animations:'disabled'});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)}
  console.log(c.id,'captured',c.sample?'(preview-only data)':'(actual fixture)')
  await context.close()
 }
 writeFileSync('artifacts/variation-subtitle-review/cases.json',JSON.stringify(cases.filter(item=>item.kind==='move'),null,2)+'\n')
}finally{await browser.close()}
