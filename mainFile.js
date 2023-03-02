const imodule = require('./imodule');
const pluginName = 'telemerAutoBucketMovement';
const utils = require('../../lib/telemerAutoBucketMovement_utility');
const db = require('./../../lib/idb');
const moment = require('moment'); 
const uuid = require('uuid');

const utilsObj = new utils(); 
const config = utilsObj.fetchConfig(pluginName); 

class telemerAutoBucketMovement extends imodule { 

  // Fetches all records from DB within a Date range
  async fetchRecords(startDate, endDate, limitCount, skipCount) {

    try {
      const readOnlyDB = db._readonly_pool();
      let res = null;
      let sql = "SELECT in_payment.policy_id from in_payment INNER JOIN in_proposal ON in_payment.proposal_id=in_proposal.proposal_id";
      sql += " WHERE (in_proposal.cust_fld_9='B008') AND (in_payment.total_recvd >= in_payment.total_amount) AND (in_payment.u_ts >=? AND in_payment.u_ts <=?) LIMIT ? OFFSET ?";
      res = await readOnlyDB.rows(sql, [startDate, endDate, limitCount, skipCount]);
      return res;
    } catch (error) {
      utilsObj.errorLogger(
        'telemerAutoBucketMovement',
        'telemerAutoBucketMovement',
        'Inside fetchRecords',
        'Exception while fetching Phonon stuck bot calling records!',
        error
      );
      throw error;
    }
  };

  async moveToTelemerBucket(memberId, proposalNo) {

    try {
    
      const phononReverseFeedUrl = config.services.insillion.baseUrl + config.constants.phononReverseFeed.url;
      
      const requestParams = {
        "proposalNo": proposalNo,
        "userId": "phononuser",
        "Details": [{
          memberId: memberId,
          phononQuestion: [
            {
              phononQ1Response: 'No',
              phononQ2Response: 'No',
              phononQ3Response: 'No',
              phononQ4Response: 'No',
              phononQ5Response: 'No',
              phononQ6Response: 'No',
            }]
        }],
        "autoBucketMovement": true
      };
      
      const token = await utilsObj.fetchAuthToken();
      
      const headers = {
          "in-auth-token": token
      };

      const moveToTelemerBucketResponse = await utilsObj.callPostApi(phononReverseFeedUrl, requestParams, headers);
      return moveToTelemerBucketResponse.data;
    }
    catch (error) {
      utilsObj.errorLogger(
        "telemerAutoBucketMovement",
        "telemerAutoBucketMovement",
        "Inside moveToTelemerBucket",
        "Exception while hitting moveToTelemerBucket API!",
        error
      );
      throw error;
    }
  }

  // Policy JSON is retrieved for each individual record. Then phononReverseFeed API and cancelCall API is called as per policy data
  async processPolicy(policyId) {

    try {
      const policyJson = await this.__policy({ policy_id: policyId }, true);

      if (!policyJson || policyJson === null || policyJson === undefined) {
        return this.sendError(400, "Policy JSON for policy ID " + policyId + " could not be fetched");
      }
      
      if (policyJson?.proposal?.data?.nstp_next_bucket_code !== "B008") {
        // Skip this iteration
        utilsObj.infoLogger(
            'telemerAutoBucketMovement',
            'telemerAutoBucketMovement',
            'Inside processPolicy',
            'Invalid nstp_next_bucket_code for policy ID: ' + policyId,
            {
                "policyId": policyId,
                "nstpNextBucketCode": policyJson?.proposal?.data?.nstp_next_bucket_code
            }
        );
        return;
      }

      const memberId = this.getMemberId(policyJson?.proposal?.data);
        
      const moveToTelemerBucketResponse = await this.moveToTelemerBucket(memberId, policyJson?.proposal_no);

      const cancelCallResponse = await this.cancelPhononCall(policyJson, memberId);

      const responseObj = {
        "phononReverseFeedApiResponse": moveToTelemerBucketResponse,
        "cancelCallApiResponse": cancelCallResponse
      };
      utilsObj.infoLogger(
        'telemerAutoBucketMovement',
        'telemerAutoBucketMovement',
        'Inside processPolicy',
        'Phonon Reverse Feed and Cancel Call Response for policy ID ' + policyId + ': ',
        responseObj
      );
      return responseObj;
    } catch (error) {
      utilsObj.errorLogger(
        'telemerAutoBucketMovement',
        'telemerAutoBucketMovement',
        'Inside processPolicy',
        'Exception in Phonon cases bucket movement!',
        error
      );
      throw error;
    }
  };

  // Picks memberId for "ReferToTeleMER" cases from policy data
  getMemberId(policyObj) {
    try {
      let i = 1;
      let memberId = null;

      while (i < 8) {
        let key = `member_msg_${i}`;
        if (policyObj[key] === 'ReferToTeleMER') {
          let memberIdKey = `member_id_${i}`;
          memberId = policyObj[memberIdKey];
          break;
        }
        i++;
      }
      return memberId;
    } catch (error) {
      utilsObj.errorLogger(
        "telemerAutoBucketMovement",
        "telemerAutoBucketMovement",
        "Inside getMemberId",
        "Exception while picking memberId from policy JSON!",
        error
      );
      throw error;
    }
  };

  // Processes records in segments of 10
  async processRecords() {
   
    try {
      const requestId = uuid.v4();

      utilsObj.infoLogger(
        "telemerAutoBucketMovement",
        "telemerAutoBucketMovement",
        "processRecords",
        "function called",
        {
          requestId: requestId
        }
      );

      const startDate = this.param('start_date');

      if (!startDate || startDate == "") {
        utilsObj.errorLogger(
          'telemerAutoBucketMovement',
          'telemerAutoBucketMovement',
          'processRecords',
          'startDate not found',
          {
            requestId: requestId,
            startDate: startDate
          }
        );
        return this.sendError(400, "startDate not found!");
      }

      const endDate = this.param('end_date');

      if (!endDate || endDate == "") {
        utilsObj.errorLogger(
          'telemerAutoBucketMovement',
          'telemerAutoBucketMovement',
          'processRecords',
          'endDate not found',
          {
            requestId: requestId,
            endDate: endDate
          }
        );
        return this.sendError(400, "endDate not found!");
      }

      const limitCount = 10; // Break total records into multiple batches of 10
      let skipCount = 0; // Number of records to skip after each iteration(when a single batch is processed)
      let currentRecordCount = 0; // Should be less than or equal to limitCount
      let fetchCompleted = false; // Flag that tracks whether all batches are processed

      while (!fetchCompleted) {
        const records = await this.fetchRecords(startDate, endDate, limitCount, skipCount);

        if (!records || records === "" || records === null || records.length === 0) {
          utilsObj.infoLogger(
            "telemerAutoBucketMovement",
            "telemerAutoBucketMovement",
            "Inside processRecords",
            "Records could not be fetched from Database!",
            {}
          );
          return this.sendSuccess("No records were fetched from the Database!");
        }
        currentRecordCount = records.length;

        if (currentRecordCount > 0) {
          const promises = [];

          for (let i = 0; i < currentRecordCount; i++) {
            const policyId = records[i].policy_id;
            const promise = await this.processPolicy(policyId);
            promises.push(promise);
          }

          // Resolve all fetched records in a single batch at once
          const results = await Promise.allSettled(promises);
          utilsObj.infoLogger(
            "telemerAutoBucketMovement",
            "telemerAutoBucketMovement",
            "Inside processRecords",
            "A batch of records fetched and processed!",
            {}
          );

          // Check for any rejected promises and handle errors
          const rejectedPromises = results.filter(p => p.status === 'rejected');

          if (rejectedPromises.length > 0) {
            const errors = rejectedPromises.map(p => p.reason);
            utilsObj.errorLogger(
              "telemerAutoBucketMovement",
              "telemerAutoBucketMovement",
              "Inside processRecords",
              "One or more promises rejected!",
              {
                requestId: requestId,
                errors: errors
              }
            );
          }
        }
        else {
          return this.sendSuccess("No records found within the given Date range!");
        }

        if (currentRecordCount < limitCount) {
          fetchCompleted = true;
        } else {
          skipCount += limitCount;
        }
      }

      utilsObj.infoLogger(
        "telemerAutoBucketMovement",
        "telemerAutoBucketMovement",
        "processRecords",
        "Records processing completed",
        {
          requestId: requestId,
          startDate: startDate,
          endDate: endDate
        }
      );

      return this.sendSuccess(`Records processing completed for date range ${startDate} to ${endDate}`);

    } catch (error) {
      utilsObj.errorLogger(
        "telemerAutoBucketMovement",
        "telemerAutoBucketMovement",
        "Inside processRecords",
        "Exception while processing Phonon stuck bot calling records!",
        error
      );
      throw error;
    }
  };

  // Phonon API is called to cancel bot calls
  async cancelPhononCall(policyJson, memberId) {

    try {
      const apiUrl = config.services.phonon.baseUrl + config.constants.phonon.url;
      const securityId = config.services.phonon.securityId;
      const flowId = config.services.phonon.flowId;
      const phoneNumber = policyJson?.quote?.data?.proposer_mobile ? policyJson?.quote?.data?.proposer_mobile : "";

      const requestData = {
        "api-version": "1.0",
        "security-id": securityId,
        "flow-id": flowId,
        "calls": [
          {
            "client-identifier": Date.now().toString(),
            "start-time": moment().format(),
            "contact-numbers": [phoneNumber],
            "keys": [
              {
                "name": "$flow.key.Name",
                "value": policyJson?.proposal?.data?.fullname_1 ? policyJson?.proposal?.data?.fullname_1 : ""
              },
              {
                "name": "$flow.key.Language",
                "value": policyJson?.proposal?.data?.tpa_language ? policyJson?.proposal?.data?.tpa_language : ""
              },
              {
                "name": "$flow.key.DOB",
                "value": policyJson?.proposal?.data.dob_1 ? policyJson?.proposal?.data?.dob_1 : ""
              },
              {
                "name": "$flow.key.PolicyNumber",
                "value": policyJson?.policy_no ? policyJson?.policy_no : ""
              },
              {
                "name": "$flow.key.Amount",
                "value": policyJson?.proposal?.data.si_1 ? policyJson?.proposal?.data?.si_1 : ""
              },
              {
                "name": "$flow.key.Productname",
                "value": policyJson?.proposal?.data?.product_name ? policyJson?.proposal?.data?.product_name : ""
              },
              {
                "name": "$flow.key.PartnerApplicationNumber",
                "value": policyJson?.proposal?.data?.proposer_partno ? policyJson?.proposal?.data?.proposer_partno : ""
              },
              {
                "name": "$flow.key.ProposalNo",
                "value": policyJson?.proposal_no ? policyJson?.proposal_no : ""
              },
              {
                "name": "$flow.key.MemberID",
                "value": memberId
              },
              {
                "name": "$flow.key.CancelCall",
                "value": "Yes"
              }
            ]
          }
        ]
      };

      const response = await utilsObj.callPostApi(apiUrl, requestData); 
      return response.data;
    } catch (error) {
      utilsObj.errorLogger(
        "telemerAutoBucketMovement",
        "telemerAutoBucketMovement",
        "Inside cancelPhononCall",
        "Exception while hitting cancelCall API!",
        error
      );
      throw error;
    }
  };
};

module.exports = telemerAutoBucketMovement;
