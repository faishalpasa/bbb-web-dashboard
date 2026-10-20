import assert from 'node:assert/strict';
import {test} from 'node:test';
import {build} from 'esbuild';

const bundle = await build({stdin: {contents: `export * from './src/utils/reading-profile'; export * from './src/components/molecules/reading-profile-section'; export * from './src/components/molecules/reading-profile-summary'; export {createElement} from 'react'; export {renderToStaticMarkup} from 'react-dom/server';`, resolveDir:process.cwd()}, bundle:true,write:false,platform:'browser',format:'esm'});
const {readingProfileFields,readingProfileInput,validateReadingProfile,ReadingProfileSection,ReadingProfileSummary,createElement,renderToStaticMarkup} = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const options = {readingInterests:[{id:'romance',code:'romance',label:'Romance <script>'},{id:'other',code:'other',label:'Lainnya'}],literacyParticipationInterests:[{value:'maybe',label:'Mungkin'}],preferredContactChannels:[{value:'email',label:'Email'}]};
const empty = readingProfileFields();
const form = (fields=empty,extra={})=>({fields,options,errors:{},setField(){},toggleInterest(){},...extra});

test('empty profile remains optional and sends explicit null/empty list',()=>{
    assert.deepEqual(validateReadingProfile(empty, options),{});
    const input=readingProfileInput(empty);
    assert.equal(input.instagramAccount,null);
    assert.equal(input.literacyParticipationInterest,null);
    assert.deepEqual(input.readingInterestIds,[]);
});
test('prefill preserves IDs, other text and enum values across a round trip',()=>{
    const fields=readingProfileFields({instagramAccount:'ibu',literacyParticipationInterest:{value:'maybe',label:'Mungkin'},preferredContactChannel:{value:'email',label:'Email'},readingInterests:options.readingInterests,readingInterestOther:'sejarah lokal'});
    const input=readingProfileInput(fields);
    assert.deepEqual(input.readingInterestIds,['romance','other']);
    assert.equal(input.literacyParticipationInterest,'maybe');
    assert.equal(input.readingInterestOther,'sejarah lokal');
});
test('trim values, preserve zero and do not mutate draft arrays',()=>{
    const fields={...empty,instagramAccount:' 0 ',readingInterestIds:['romance']};
    const input=readingProfileInput(fields);input.readingInterestIds.push('other');
    assert.equal(input.instagramAccount,'0');assert.deepEqual(fields.readingInterestIds,['romance']);
});
test('Other is required only when selected, and missing options cannot erase a saved profile',()=>{
    assert.ok(validateReadingProfile({...empty,readingInterestIds:['other']},options).readingInterestOther);
    assert.deepEqual(validateReadingProfile({...empty,readingInterestIds:['other'],readingInterestOther:'lokal'},options),{});
    assert.ok(validateReadingProfile(empty,null).readingInterestIds);
});
test('unknown and duplicate IDs are rejected without relabeling selections',()=>{
    assert.ok(validateReadingProfile({...empty,readingInterestIds:['unknown']},options).readingInterestIds);
    assert.ok(validateReadingProfile({...empty,readingInterestIds:['romance','romance']},options).readingInterestIds);
});
test('Unicode length boundaries match server character limits',()=>{
    for(const [field,max] of Object.entries({instagramAccount:255,goodreadsAccount:255,favoriteBooksAuthors:5000,readingInterestOther:5000})) {
        assert.equal(validateReadingProfile({...empty,[field]:'あ'.repeat(max)},options)[field],undefined);
        assert.ok(validateReadingProfile({...empty,[field]:'あ'.repeat(max+1)},options)[field]);
    }
});
test('only explicit HTTP and HTTPS websites are accepted',()=>{
    for(const url of ['https://example.test','http://example.test/a']) assert.equal(validateReadingProfile({...empty,websiteUrl:url},options).websiteUrl,undefined);
    for(const url of ['javascript:alert(1)','ftp://example.test','example.test']) assert.ok(validateReadingProfile({...empty,websiteUrl:url},options).websiteUrl);
    const prefix='https://example.test/';
    assert.equal(validateReadingProfile({...empty,websiteUrl:prefix+'a'.repeat(2048-prefix.length)},options).websiteUrl,undefined);
    assert.ok(validateReadingProfile({...empty,websiteUrl:prefix+'a'.repeat(2049-prefix.length)},options).websiteUrl);
});
test('form labels and saved text are escaped, with an accessible conditional Other control',()=>{
    const html=renderToStaticMarkup(createElement(ReadingProfileSection,{form:form({...empty,readingInterestIds:['other'],readingInterestOther:'<script>alert(1)</script>'}),'data-test-id':'reading'}));
    assert.match(html,/type="checkbox"/);assert.match(html,/aria-required="true"/);
    assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);
    assert.match(html,/min-h-11/);
    assert.doesNotMatch(renderToStaticMarkup(createElement(ReadingProfileSection,{form:form(),'data-test-id':'reading'})),/id="reading-readingInterestOther"/);
});
test('submitting and unavailable options disable the fieldset',()=>{
    assert.match(renderToStaticMarkup(createElement(ReadingProfileSection,{form:form(),disabled:true,'data-test-id':'reading'})),/<fieldset disabled/);
    assert.match(renderToStaticMarkup(createElement(ReadingProfileSection,{form:form(empty,{options:null}),'data-test-id':'reading'})),/Pilihan profil belum dimuat/);
});
test('summary renders plain text instead of links or HTML from imported content',()=>{
    const html=renderToStaticMarkup(createElement(ReadingProfileSummary,{profile:{...readingProfileInput(empty),readingInterests:options.readingInterests,favoriteBooksAuthors:'<script>bad</script>'},'data-test-id':'summary'}));
    assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>|<a\b/);
    assert.match(html,/Belum diisi/);
});
