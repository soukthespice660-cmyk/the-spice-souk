import test from 'node:test';
import assert from 'node:assert/strict';
import {channelUrl} from '../public/whatsapp-links.mjs';
test('channel links accept only secure official WhatsApp channel URLs',()=>{
  assert.equal(channelUrl('https://whatsapp.com/channel/test-channel'),'https://whatsapp.com/channel/test-channel');
  assert.equal(channelUrl('https://www.whatsapp.com/channel/test-channel/'),'https://www.whatsapp.com/channel/test-channel/');
  for(const value of ['',undefined,'javascript:alert(1)','http://whatsapp.com/channel/test-channel','https://whatsapp.com.evil.test/channel/test-channel','https://user@whatsapp.com/channel/test-channel','https://whatsapp.com:8443/channel/test-channel','https://whatsapp.com/send'])assert.equal(channelUrl(value),null);
});
