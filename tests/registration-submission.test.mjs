import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';
const bundle=await build({stdin:{contents:`export * from './src/utils/registration-submission'; export * from './src/components/molecules/registration-answer-fields'; export {createElement} from 'react'; export {renderToStaticMarkup} from 'react-dom/server';`,resolveDir:process.cwd()},bundle:true,write:false,platform:'browser',format:'esm'});
const {registrationSubmission,RegistrationAnswerFields,createElement,renderToStaticMarkup}=await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const definition={version:4,fields:[{id:'input',type:'input',label:'Buku <script>',required:true,options:[]},{id:'text',type:'textarea',label:'Harapan',required:false,options:[]},{id:'select',type:'select',label:'Genre',required:true,options:[{id:'s1',label:'Fiksi'}]},{id:'radio',type:'radio',label:'Sesi',required:false,options:[{id:'r1',label:'Pagi'}]}]};
const valid={input:' Buku anak ',select:'s1'};
test('payload keeps server version and ordered field IDs; optional whitespace becomes null',()=>{
    const {input,errors}=registrationSubmission(definition,{...valid,text:'  '});
    assert.deepEqual(errors,{});
    assert.deepEqual(input,{formVersion:4,answers:[{fieldId:'input',value:'Buku anak'},{fieldId:'text',value:null},{fieldId:'select',value:'s1'},{fieldId:'radio',value:null}]});
});
test('required and choice errors are keyed by stable IDs',()=>{
    const result=registrationSubmission(definition,{select:'r1',radio:'s1'});
    assert.deepEqual(Object.keys(result.errors),['input','select','radio']);
});
test('text limits accept 255 and 5000 and refuse one extra character',()=>{
    assert.deepEqual(registrationSubmission(definition,{...valid,input:'x'.repeat(255),text:'x'.repeat(5000)}).errors,{});
    assert.deepEqual(Object.keys(registrationSubmission(definition,{...valid,input:'x'.repeat(256),text:'x'.repeat(5001)}).errors),['input','text']);
});
test('reordering a definition does not attach a value to another field',()=>{
    const next={...definition,fields:[...definition.fields].reverse()};
    assert.deepEqual(registrationSubmission(next,valid).input.answers.map(a=>a.value),[null,'s1',null,'Buku anak']);
});
test('renderer includes four field types, stable selectors and escaped labels/values',()=>{
    const html=renderToStaticMarkup(createElement(RegistrationAnswerFields,{definition,values:{...valid,input:'<script>alert(1)</script>'},errors:{input:'Salah'},onChange(){}}));
    assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);
    assert.match(html,/<textarea/);assert.match(html,/<select/);assert.match(html,/type="radio"/);
    assert.match(html,/aria-invalid="true"/);assert.match(html,/answer-input-error/);
});
test('submitting disables all inputs and optional radio has a clear action',()=>{
    const html=renderToStaticMarkup(createElement(RegistrationAnswerFields,{definition,values:valid,errors:{},disabled:true,onChange(){}}));
    const controls=[...html.matchAll(/<(input|select|textarea|button)\b[^>]*>/g)].map(m=>m[0]);
    assert.ok(controls.length>=5);assert.ok(controls.every(tag=>tag.includes('disabled')));
    assert.match(html,/registration_clear_radio/);
});
test('checkbox submits multiple IDs in definition order and optional empty as null',()=>{
    const checkbox={id:'multi',type:'checkbox',label:'Bawa siapa?',required:true,options:[{id:'c1',label:'Anak 1'},{id:'c2',label:'Anak 2'},{id:'c3',label:'Teman'}]};
    const withCheckbox={...definition,fields:[...definition.fields,checkbox]};
    const result=registrationSubmission(withCheckbox,{...valid,multi:['c3','c1']});
    assert.deepEqual(result.errors,{});
    assert.deepEqual(result.input.answers.at(-1),{fieldId:'multi',value:['c1','c3']});
    assert.equal(registrationSubmission(withCheckbox,valid).errors.multi,'Isian ini wajib diisi.');
    assert.deepEqual(registrationSubmission({...withCheckbox,fields:[{...checkbox,required:false}]},{}).input.answers[0].value,null);
    for(const wrong of [['c1','c1'],['unknown'],'c1'])
        assert.ok(registrationSubmission(withCheckbox,{...valid,multi:wrong}).errors.multi);
    const html=renderToStaticMarkup(createElement(RegistrationAnswerFields,{definition:withCheckbox,values:{...valid,multi:['c1','c3']},errors:{},onChange(){}}));
    assert.equal([...html.matchAll(/type="checkbox"/g)].length,3);
    assert.match(html,/registration_option_c3/);
});
