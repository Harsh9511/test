const cron = require('node-cron');
const axios = require('axios');

// Schedule the job to run every weekday at 12:30 PM
cron.schedule('30 12 * * 1-5', async () => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const fetchUrl = `https://api.example.com/fetch24hrsRecords?date=${yesterday.toISOString()}`;
    const fetchResponse = await axios.get(fetchUrl);
    const proposals = fetchResponse.data.proposals;
    const policyUrl = 'https://api.example.com/fetchPolicyData';

    for (let i = 0; i < proposals.length; i++) {
      const proposal = proposals[i];
      if (proposal.status === 'Bot Calling' && proposal.timeElapsed > 24) {
        const policyResponse = await axios.get(policyUrl, { params: { policyId: proposal.policyId }});
        const policyType = policyResponse.data.policyType;
        if (policyType === 'Phonon') {
          const telemerUrl = 'https://api.example.com/moveToTeleMER';
          await axios.post(telemerUrl, { proposalId: proposal.id });
          const phononUrl = 'https://api.example.com/informPhonON';
          await axios.post(phononUrl, { proposalId: proposal.id });
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
});

// Schedule the job to run on Monday at 12:30 PM for weekend proposals
cron.schedule('30 12 * * 1', async () => {
  try {
    const saturday = new Date();
    saturday.setDate(saturday.getDate() - (saturday.getDay() === 0 ? 2 : (saturday.getDay() === 1 ? 3 : 1)));
    const fetchUrl = `https://api.example.com/fetch24hrsRecords?date=${saturday.toISOString()}`;
    const fetchResponse = await axios.get(fetchUrl);
    const proposals = fetchResponse.data.proposals;
    const policyUrl = 'https://api.example.com/fetchPolicyData';

    for (let i = 0; i < proposals.length; i++) {
      const proposal = proposals[i];
      const policyResponse = await axios.get(policyUrl, { params: { policyId: proposal.policyId }});
      const policyType = policyResponse.data.policyType;
      if (policyType === 'Phonon') {
        const telemerUrl = 'https://api.example.com/moveToTeleMER';
        await axios.post(telemerUrl, { proposalId: proposal.id });
        const phononUrl = 'https://api.example.com/informPhonON';
        await axios.post(phononUrl, { proposalId: proposal.id });
      }
    }
  } catch (error) {
    console.error(error);
  }
});
