const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI('AIzaSyBo9TWonfvIpNo-QwmO77-5Kxk8NXtPvoo');

async function testModel(name) {
  try {
    const model = genAI.getGenerativeModel({ model: name });
    await model.generateContent('hi');
    console.log(name, 'WORKS');
  } catch(e) {
    console.error(name, 'FAILED', e.message);
  }
}

async function run() {
  await testModel('gemini-flash-latest');
  await testModel('gemini-pro-latest');
  await testModel('gemini-1.5-flash-latest');
  await testModel('gemini-2.5-flash');
}
run();
