
const imodule = require('./imodule');
const utils = require('../../lib/utils');
const error = require('../../lib/error');
const db = require('./../../lib/idb');
const conf = require('./../../config');
const request = require('request');
var base_url = 'http://127.0.0.1:' + process.env['APP_PORT'];

class phononreversefeed extends imodule {


    async post_root(parts) {
        var params = this.params();
        var proposalno = this.valid_param('proposalNo');
        var userID = this.valid_param('userId');
        var _details = this.valid_param('Details');


        try {
            var policy = await this._one_policy({
                proposal_no: proposalno
            }, true);
            // Added below logic for handling Phonon for cross sell by Armaan on 22/12/2022
            let crosell_flag = policy.quote.data.product_name == 'Medicare' && policy.proposal.data.crosell_id ? true : false;
            let racdata = [];
            for (let ite = 0; i < (crosell_flag ? 2 : 1); i++) {
                if (ite == 1) {
                    policy = await this._one_policy({
                        proposal_no: policy.proposal.data.medicare_plus.proposal_no
                    }, true);

                    if (policy == undefined || policy == null || policy == "")
                        return this.sendError(-102, "Invalid Proposal No");

                    if (!policy.payment.details.length) {
                        racdata.push({
                            "Assigned To": policy.assigned_to,
                            "product_id": policy.product_id,
                            "ipdsstatus": "Payment not completed"
                        })
                        return this.sendSuccess(racdata);
                    }
                    if (policy.proposal.data.nstp_next_bucket_code != 'B008') {
                        racdata.push({
                            "Assigned To": policy.assigned_to,
                            "product_id": policy.product_id,
                            "ipdsstatus": "Proposal is not in Phonon Bucket"
                        })
                        return this.sendSuccess(racdata);
                    }
                    proposalno = policy.proposal_no
                    for (let j = 0; j < _details.length; j++) {
                        _details[j].memberId = policy.proposal.data['member_id_' + (j + 1)]
                    }
                }

                let mem = [];
                let refertoPhononArray = [];
                let memberid_array = [];
                let tempDecisionArray = [];
                //let _sql = "insert into m_medicare_phononlog(quotation_no,proposal_no,policy_id,module_ref,api_name,api_request,api_response,status,info_msg,author,ip) VALUES (?,?,?,?,?,?,?,?,?,?,?)";
                //let _sql_res = await db.exec(_sql, ["", "", "", "REVERSEFEED", "REVERSEFEED-ENTRY", JSON.stringify(params), "", "Success", "Success", this.author(), this.ip()]);
                //Added for storing all product data
                let _sql = "insert into health_phononlog(product_name,product_code,quotation_no,proposal_no,policy_id,module_ref,api_name,api_request,api_response,status,info_msg,author,ip) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)";
                let _sql_res = await db.exec(_sql, ["", "", "", "", "", "REVERSEFEED", "REVERSEFEED-ENTRY", JSON.stringify(params), "", "Success", "Success", this.author(), this.ip()]);

                if (policy == undefined || policy == null || policy == "")
                    return this.sendError(-102, "Invalid Proposal No");

                if (_details.length <= 0)
                    return this.sendError(-102, "Please provide valid details");

                for (var i = 0; i < _details.length; i++) {
                    if (!this.valid_param('Details')[i].memberId) {
                        return this.sendError(-103, "Member Id cannot be empty");
                    }
                    mem.push(this.valid_param('Details')[i]);
                }

                for (i = 1; i <= policy.proposal.data.total_members; i++) {
                    refertoPhononArray.push(policy.proposal.data["member_msg_" + i]);

                }

                for (i = 1; i <= policy.proposal.data.total_members; i++) {
                    memberid_array.push(policy.proposal.data["member_id_" + i]);

                }

                var phononcount = 0;
                for (i = 0; i < refertoPhononArray.length; i++) {
                    if (refertoPhononArray[i] == "ReferToTeleMER") {
                        phononcount += 1;

                    }

                }


                if (phononcount != _details.length) {
                    return this.sendError(-102, "Incorrect phonon details", phononcount);
                }

                var tempMemberIdArray = [];
                var temparray = [];


                // 	return this.sendError(-103, "Please check None of the member is reffered to telemer", referTelmerArray.length );  

                for (i = 0; i < refertoPhononArray.length; i++) {

                    if (refertoPhononArray[i] == 'ReferToTeleMER') {
                        tempDecisionArray.push(i);
                    } else {
                        tempDecisionArray.push("undefined");
                    }
                }



                var memberIdOnly = [];
                //console.log("temp desiceion array ----", tempDecisionArray);
                if (tempDecisionArray.length > 0) {
                    for (i = 0; i < tempDecisionArray.length; i++) {
                        if (tempDecisionArray[i] != 'undefined') {
                            tempMemberIdArray.push(memberid_array[i]);
                            memberIdOnly.push(memberid_array[i]);
                        } else {
                            tempMemberIdArray.push("undefined");
                        }
                    }
                }


                if (memberIdOnly.length > 0) {
                    for (var i = 0; i < memberIdOnly.length; i++) {
                        if (memberIdOnly[i] != mem[i].memberId) {
                            //await this.submit_log(proposalno,"Error",params,"Invalid member id");
                            return this.sendError(-102, "Invalid member id");
                        }
                    }
                }

                var tpaarray = [];
                var tempQuestions = [];
                for (var i = 0; i < _details; i++) {
                    var Queslength = this.valid_param('Details')[i].phononQuestion.length

                    tpaarray.push(this.valid_param('Details'))


                    tempQuestions.push(this.valid_param('Details')[i])
                }

                let _phononresponse = [];

                for (var i = 0; i < tempMemberIdArray.length; i++) {
                    if (tempMemberIdArray[i] != 'undefined') {
                        for (var k = 0; k < _details.length; k++) {
                            if (tempMemberIdArray[i] == _details[k].memberId) {
                                _phononresponse.push(_details[k].phononQuestion)
                            }
                        }
                    } else {
                        _phononresponse.push("");
                    }
                }

                //if(proposalno == "PRU/21/7000009303")
                //  return this.sendError(-102,JSON.stringify(_phononresponse[0]));
                //return this.sendError(-102, "phonon details"+ _phononresponse.length >= 1 ? JSON.stringify(_phononresponse[0]) : "");

                // Calling Auth
                var url = `https://${conf.app.domain}/api/v1/auth`;
                console.log("URL :: ", url);
                var headers = {
                    'Content-Type': 'application/json'
                };
                console.log("Header :: ", headers);
                var reqData = {
                    "email": "phononuser@tataaig.com",
                    "pwd": "224575"
                    // "email":"admin","pwd":"DontChangePass987!"
                };
                var resData;
                let response = await this.apost(url, JSON.stringify(reqData), headers).then(async function (_Response) {
                    var _resp = _Response;
                    resData = _resp;
                    console.log("----AUTH SUCCESS----");

                });
                var responsedata = new Object();
                responsedata = JSON.parse(resData);
                var token = responsedata.data.token;
                if (responsedata.status == 0) {
                    console.log("----Call claim----")
                    url = `https://${conf.app.domain}/api/v1/quote/claim/` + policy.quote_id;
                    //console.log("URL :: ", url);
                    headers = {
                        'in-auth-token': token,
                        'Content-Type': 'application/json'
                    };
                    //console.log("Header :: ", headers);
                    let response = await this.apost(url, null, headers).then(async function (_Response) {
                        var _resp = _Response;
                        resData = _resp;
                        console.log("---CLAIM SUCCESS----");

                    });
                    responsedata = JSON.parse(resData);

                    if (responsedata.status == 0) {

                        console.log("----Call assign----")
                        url = `https://${conf.app.domain}/api/v1/policy/note?policy_id=` + policy.policy_id + `&subject=Assign&message=AssigningToPhonon&assign_to=phononuser@tataaig.com`;
                        //console.log("URL :: ", url);
                        headers = {
                            'in-auth-token': token,
                            'Content-Type': 'application/json'
                        };
                        //console.log("Header :: ", headers);
                        let response = await this.apost(url, null, headers).then(async function (_Response) {
                            var _resp = _Response;
                            resData = _resp;
                            console.log("----ASSIGN SUCCESS----");

                        });

                        responsedata = JSON.parse(resData);


                        if (responsedata.status == 0) {
                            console.log("----Call counteroffer----")
                            url = `https://${conf.app.domain}/api/v1/proposal/counteroffer/` + policy.proposal_id;
                            //console.log("URL :: ", url);
                            headers = {
                                'in-auth-token': token,
                                'Content-Type': 'application/json'
                            };
                            //console.log("Header :: ", headers);
                            let response = await this.apost(url, null, headers).then(async function (_Response) {
                                var _resp = _Response;
                                resData = _resp;
                                console.log("----COUNTEROFFER SUCCESS----");

                            });

                            responsedata = JSON.parse(resData);
                            if (responsedata.status == 0) {
                                ///**** Get exisiting data from policy JSON*****//
                                console.log("----Call save proposal----")
                                url = `https://${conf.app.domain}/api/v1/proposal`;
                                //console.log("URL :: ", url);
                                headers = {
                                    'in-auth-token': token,
                                    'Content-Type': 'application/json'
                                };
                                //console.log("Header :: ", headers);
                                let updated_json = policy.proposal.data;
                                updated_json.proposal_valid = "1",
                                    updated_json.proposal_id = policy.proposal_id,
                                    updated_json.nstp_from_bucket_code = "B008",
                                    updated_json.nstp_from_stage_code = "S021",
                                    updated_json.nstp_decision_code = "D001",
                                    updated_json.phonon_m1 = _phononresponse.length >= 1 ? _phononresponse[0] : "",
                                    updated_json.phonon_m2 = _phononresponse.length >= 2 ? _phononresponse[1] : "",
                                    updated_json.phonon_m3 = _phononresponse.length >= 3 ? _phononresponse[2] : "",
                                    updated_json.phonon_m4 = _phononresponse.length >= 4 ? _phononresponse[3] : "",
                                    updated_json.phonon_m5 = _phononresponse.length >= 5 ? _phononresponse[4] : "",
                                    updated_json.phonon_m6 = _phononresponse.length >= 6 ? _phononresponse[5] : "",
                                    updated_json.phonon_m7 = _phononresponse.length >= 7 ? _phononresponse[6] : "",
                                    updated_json.phonon_data = _details;
                                //console.log("Phonon response--->",updated_json.phonon_details_m1);
                                //console.log("Phonon response---phonon_data>",updated_json.phonon_data);
                                try {
                                    let response = await this.apost(url, JSON.stringify(updated_json), headers).then(async function (_Response) {

                                        var _resp = _Response;
                                        resData = _resp;
                                        // console.log("Response of Save proposal--->", _resp);
                                        //console.log("Response of Save proposal--->2", resData);
                                    });
                                } catch (e) {
                                    await this.submit_log(proposalno, "Error - Save Proposal", url + " " + JSON.stringify(updated_json), responsedata);
                                    console.log("Exception In proposal service----------------------------------------->");
                                }


                                responsedata = JSON.parse(resData);
                                console.log("responsedata----------------------------------------->", responsedata);
                                if (responsedata.status == -102) {
                                    await this.submit_log(proposalno, "Error - Save Proposal", url + " " + JSON.stringify(updated_json), responsedata);
                                    return this.sendError(-102, "Data is wrong-Please recheck the given question details", responsedata);
                                }

                                //   return this.sendError(-103, "document finalize failed", responsedata);

                                let _ttemp = await this.trig_mail(responsedata);
                                let pace_url;
                                let product_name = responsedata.data[0].proposal.data.product_name;
                                if (responsedata.data[0].proposal.data.nstp_final_status == "Reject") {
                                    if (product_name == "MediCare" || product_name == "Medicare") {
                                        pace_url = `${base_url}/api/v1/medicare_common/integratetopace?policy_id=` + policy.policy_id;
                                    } else if (product_name == "Medicare Plus") {
                                        pace_url = `${base_url}/api/v1/mp_common/integratetopace?policy_id=` + policy.policy_id;
                                    } else if (product_name == "Criti-Medicare") {
                                        pace_url = `${base_url}/api/v1/cc_common/integratetopace?policy_id=` + policy.policy_id;
                                    }
                                    let pace_head = { 'in-auth-token': this.req.headers["in-auth-token"], 'Content-Type': 'application/json' };
                                    let pace_req = { 'in-auth-token': this.req.headers["in-auth-token"] };

                                    var pace_data = await utils.apost(pace_url, pace_req, pace_head);

                                    await this.submit_log(proposalno, "Error - Proposal rejected", url + " " + JSON.stringify(updated_json), responsedata);
                                    return this.sendSuccess("Your Proposal is Rejected by BRE based on Question details");
                                }

                                if (responsedata.status == 0) {
                                    console.log("----SAVEPROPOSAL SUCCESS----");
                                    var nstp_next_bucket_code = responsedata.data[0].proposal.data.nstp_next_bucket_code
                                    var stage_code = responsedata.data[0].proposal.data.nstp_next_stage_code
                                    var created_by = responsedata.data[0].created_by
                                    console.log("----Call finalize proposal----")
                                    url = `https://${conf.app.domain}/api/v1/proposal/finalize`;
                                    //console.log("URL :: ", url);
                                    headers = {
                                        'in-auth-token': token,
                                        'Content-Type': 'application/json'
                                    };
                                    //console.log("Header :: ", headers);
                                    reqData = {
                                        "proposal_id": responsedata.data[0].proposal_id
                                    };
                                    //console.log("reqData :: ", reqData);

                                    let response = await this.apost(url, JSON.stringify(reqData), headers).then(async function (_Response) {
                                        var _resp = _Response;
                                        resData = _resp;
                                        console.log("----FINALIZEPROPOSAL SUCCESS----");
                                        // console.log("----FINALIZEPROPOSAL Response----",response);

                                    });

                                    responsedata = JSON.parse(resData);

                                    if (responsedata.status == 0) {
                                        console.log("---------------------- 1");
                                        var documentid = responsedata.data[0].document_id
                                        console.log("---------------------- 2");
                                        console.log("----Call meta api----")
                                        url = `https://${conf.app.domain}/api/v1/policy/meta/` + policy.policy_id;
                                        //console.log("URL :: ", url);
                                        headers = {
                                            'in-auth-token': token,
                                            'Content-Type': 'application/json'
                                        };
                                        //	console.log("Header :: ", headers);
                                        reqData = {
                                            "search": {
                                                "customer_name": responsedata.data[0].proposal.data.proposer_fullname,
                                                "customer_email": responsedata.data[0].proposal.data.proposer_email,
                                                "customer_mobileno": responsedata.data[0].proposal.data.proposer_mobile,
                                                "premium": responsedata.data[0].proposal.data.premium_value,
                                                "product_name": responsedata.data[0].proposal.data.variant,
                                                "policy_plan_name": responsedata.data[0].proposal.data.product_name,
                                                "business_type": responsedata.data[0].proposal.data.business_type,
                                                "varient": responsedata.data[0].proposal.data.variant,
                                                "plan_type": responsedata.data[0].proposal.data.plan_type,
                                                "tenure": responsedata.data[0].proposal.data.pol_tenure,
                                                "member_is_employee": responsedata.data[0].proposal.data.proposer_tata,
                                                "Status": "",
                                                "nstp_status": responsedata.data[0].proposal.data.proposal_status,
                                                "proposal_id": responsedata.data[0].proposal_id,
                                                "proposal_no": responsedata.data[0].proposal_no,
                                                "quote_no": responsedata.data[0].quote_no,
                                                "proposer_title": responsedata.data[0].proposal.data.proposer_salutation,
                                                "mname_proposer": responsedata.data[0].proposal.data.proposer_mname,
                                                "lname_proposer": responsedata.data[0].proposal.data.proposer_lname,
                                                "location": responsedata.data[0].proposal.data.q_branch_location,
                                                "product_id": responsedata.data[0].product_id
                                            }
                                        }
                                        let response = await this.apost(url, JSON.stringify(reqData), headers).then(async function (_Response) {
                                            var _resp = _Response;
                                            resData = _resp;
                                            console.log("----METAAPI SUCCESS----");

                                        });

                                        responsedata = JSON.parse(resData);

                                        if (responsedata.status == 0) {
                                            console.log("----Call document finalize----")
                                            url = `https://${conf.app.domain}/api/v1/document/finalize/` + documentid;
                                            //console.log("URL :: ", url);
                                            headers = {
                                                'in-auth-token': token,
                                                'Content-Type': 'application/json'
                                            };
                                            //console.log("Header :: ", headers);
                                            let response = await this.apost(url, null, headers).then(async function (_Response) {
                                                var _resp = _Response;
                                                resData = _resp;
                                                console.log("----DOCUMENTFINALIZE SUCCESS----");

                                            });

                                            responsedata = JSON.parse(resData);

                                            if (responsedata.status == 0) {
                                                var assignee;
                                                var assignmsg;
                                                var paymentid = responsedata.data[0].payment_id
                                                var gc_product_code = responsedata.data[0].proposal.data.gc_product_code
                                                if (nstp_next_bucket_code == "B001") {
                                                    assignee = created_by;
                                                    assignmsg = "Assign to Producer";

                                                } else if (stage_code == "S005" || stage_code == "S004" || stage_code == "S013" || stage_code == "S014" || stage_code == "S015" || stage_code == "S017" || stage_code == "S018") {
                                                    assignee = "G000000000087";
                                                    assignmsg = "Assign to Medicare Team";
                                                } else if (stage_code == "S005" || stage_code == "S004" || stage_code == "S013" || stage_code == "S014" || stage_code == "S015" || stage_code == "S017" || stage_code == "S018") {
                                                    if (gc_product_code == "2896") {
                                                        assignee = "G000000000102";
                                                        assignmsg = "Assign to Medicare Plus Team";
                                                    } else {
                                                        assignee = "G000000000087";
                                                        assignmsg = "Assign to Medicare Team";
                                                    }
                                                } else if (stage_code == "S005" || stage_code == "S004" || stage_code == "S013" || stage_code == "S014" || stage_code == "S015" || stage_code == "S017" || stage_code == "S018") {
                                                    if (gc_product_code == "2804") {
                                                        assignee = "G000000008601";
                                                        assignmsg = "Assign to Criti-Medicare Team";
                                                    } else {
                                                        assignee = "G000000000087";
                                                        assignmsg = "Assign to Medicare Team";
                                                    }
                                                } else if (nstp_next_bucket_code == "B003") {
                                                    assignee = "G000000002002";
                                                    assignmsg = "Assign to COPS";

                                                } else if (nstp_next_bucket_code == "B004") {
                                                    assignee = "G000000008441";
                                                    assignmsg = "Assign to Telemer";

                                                } else if (nstp_next_bucket_code == "B007") { //reject case
                                                    assignee = "G000000000087";
                                                    assignmsg = "Assign to Medicare Team";

                                                } else if (nstp_next_bucket_code == "B002") { //reject case
                                                    assignee = "G000000000215";
                                                    assignmsg = "Assign to UW";

                                                } else if (nstp_next_bucket_code == "B005") {

                                                    url = `https://${conf.app.domain}/api/v1/payment/finalize/` + paymentid;
                                                    //console.log("URL :: ", url);
                                                    headers = {
                                                        'in-auth-token': token,
                                                        'Content-Type': 'application/json'
                                                    };
                                                    //console.log("Header :: ", headers);
                                                    let response = await this.apost(url, null, headers).then(async function (_Response) {
                                                        var _resp = _Response;
                                                        resData = _resp;
                                                        console.log("----DOCUMENTFINALIZE SUCCESS----");

                                                    });

                                                    responsedata = JSON.parse(resData);
                                                    if (responsedata.status == 0) {
                                                        assignee = created_by;
                                                        var policy_number = responsedata.data[0].policy_no;
                                                        var polId = responsedata.data[0].policy_id;
                                                        assignmsg = "Assign to Producer";


                                                    }
                                                }

                                                console.log("----Call final assign----")
                                                url = `https://${conf.app.domain}/api/v1/policy/note?policy_id=` + policy.policy_id + '&subject=Assign&message=' + assignmsg + '&assign_to=' + assignee;
                                                //console.log("URL :: ", url);	
                                                headers = {
                                                    'in-auth-token': token,
                                                    'Content-Type': 'application/json'
                                                };
                                                //console.log("Header :: ", headers);
                                                let response = await this.apost(url, null, headers).then(async function (_Response) {
                                                    var _resp = _Response;
                                                    resData = _resp;
                                                    console.log("----FINALASSIGN SUCCESS----");

                                                });

                                                responsedata = JSON.parse(resData);

                                                if (responsedata.status == 0) {
                                                    // For success
                                                    // For success
                                                    let id = await this.random_id()
                                                    let policyId = policy.policy_id;
                                                    let product_code = policy.proposal.data.gc_product_code;
                                                    let serviceId = "paceUpdateCase";
                                                    let sql = ""
                                                    let resp_pace = ""
                                                    try {
                                                        let plugin_url = '/api/v1/partnerIntegration.integratePartner'
                                                        resp_pace = await this.__call_node_method(plugin_url, [this.req, this.res], [policyId, serviceId, id])
                                                        sql = `insert into health_partner_integration(Proposal_No,Policy_ID,Integration,add_info_1,api_response) values (?,?,?,?,?)`
                                                        await db.exec(sql, [policy.proposal_no, policyId, serviceId, id, JSON.stringify(resp_pace)])
                                                    } catch (ex) {
                                                        ex = typeof ex != 'string' ? JSON.stringify(ex) : ex
                                                        sql = `insert into health_partner_integration(Proposal_No,Policy_ID,Integration,add_info_1,api_response) values (?,?,?,?,?)`
                                                        await db.exec(sql, [policy.proposal_no, policyId, serviceId, id, ex])
                                                    } // let _paceres = await this.integratetopace(proposalno);
                                                    // Modified below logic for handling cross sell on 22/12/2022 by Armaan
                                                    if (!crosell_flag) {
                                                        racdata.push({
                                                            "Assigned To": assignmsg,
                                                            "ipdsstatus": "Proposal submitted successfully"
                                                        });
                                                        await this.submit_log(proposalno, "Success", racdata, "Proposal submitted successfully");
                                                        return this.sendSuccess(racdata);
                                                    } else {
                                                        racdata.push({
                                                            "Assigned To": assignmsg,
                                                            "product_id": policy.product_id,
                                                            "ipdsstatus": "Proposal submitted successfully"
                                                        });
                                                        await this.submit_log(proposalno, "Success", racdata, "Proposal submitted successfully");

                                                        if (ite == 1) return this.sendSuccess(racdata);
                                                    }
                                                } else {
                                                    await this.submit_log(proposalno, "final assign failed", url, responsedata);
                                                    return this.sendError(-102, "final assign failed", responsedata.txt);
                                                }


                                            } else {
                                                await this.submit_log(proposalno, "document finalize failed", url, responsedata);
                                                return this.sendError(-102, "document finalize failed", responsedata.txt);
                                            }
                                        } else {
                                            await this.submit_log(proposalno, "metaapi failed", url, responsedata);
                                            return this.sendError(-102, "metaapi failed", responsedata.txt);
                                        }
                                    } else {
                                        await this.submit_log(proposalno, "finalize proposal failed", url, responsedata);
                                        return this.sendError(-102, "finalize proposal failed", responsedata.txt);
                                    }
                                } else {
                                    await this.submit_log(proposalno, "save proposal failed", url, responsedata);
                                    return this.sendError(-102, "save proposal failed", responsedata.txt);
                                }
                            } else {
                                await this.submit_log(proposalno, "counteroffer failed", url, responsedata);
                                return this.sendError(-102, "counteroffer failed", responsedata.txt);
                            }
                        } else {
                            await this.submit_log(proposalno, "assign failed", url, responsedata);
                            return this.sendError(-102, "assign failed", responsedata.txt);
                        }
                    } else {
                        await this.submit_log(proposalno, "claim failed", url, responsedata);
                        return this.sendError(-102, "claim failed", responsedata.txt);
                    }
                } else {
                    await this.submit_log(proposalno, "Auth failed", url, responsedata);
                    return this.sendError(-102, "Auth failed", responsedata.txt);
                }

            }
            //else{
            await this.submit_log(proposalno, "Success", assignmsg, "Proposal submitted successfully");
            return this.sendSuccess("Proposal No " + assignmsg);




            return this.sendSuccess("_phononresponse--", _phononresponse);

        } catch (ex) {
            return this.sendSuccess("Exception--", ex);
        }


        return this.sendSuccess(Queslength);
    }

    async integratetopace(propno) {
        let pdata = {};
        let _sql, _sql_res;
        let _fresh_policy = await this._one_policy({ proposal_no: propno }, true);
        pdata['policy'] = _fresh_policy;
        let product_name = pdata['policy'].quote.data.product_name;
        if (pdata['policy'] == undefined || pdata['policy'] == null || pdata['policy'] == "") return this.sendError(-102, "Invalid Policy ID", _fresh_policy.policy_id);

        let _pace_req = await this.pace_json(pdata['policy']);

        console.log('Fetched call_PaceApi request----------->');
        let _pace_resp = "";
        let _pace_url;

        if (product_name == "MediCare" || product_name == "Medicare") {
            _pace_url = "http://10.0.1.83:9101/realtime-pace/api/v1/policy/mcservice"
        } else if (product_name == "Medicare Plus") {
            _pace_url = "http://10.0.1.83:9101/realtime-pace/api/v1/policy/mcplusservice";
        } else if (product_name == "Criti-Medicare") {
            _pace_url = "http://10.0.1.83:9101/realtime-pace/api/v1/policy/cmcservice";
        }
        // _pace_url = "http://10.0.1.83:9101/realtime-pace/api/v1/policy/mcservice"
        let headers = {
            "Content-Type": "application/json"
        };


        let paceStatus = "";
        try {
            _pace_resp = await utils.apost(_pace_url, _pace_req, headers);
            if (_pace_resp.responseCode == "202")
                paceStatus = "Success";
            else
                paceStatus = "Failed";

            if (_pace_resp.responseCode == undefined) {
                pdata['policy'].pace_err_now = JSON.stringify(_pace_resp);
                await imail.sendTemplatedEmail("varunprasath@godbtech.com,ranjana@godbtech.com,josephvijayakumar@godbtech.com,Vikas.Bharatwal@tataaig.com,rsuraj@godbtech.com,elangodi@godbtech.com,sskarthikeyan@godbtech.com", pdata['policy'], 'mc_pace_mail', "tags", "");
            }
            //return this.sendSuccess("Integrated with PACE",paceStatus);
            //console.log('Called Thillais PACE API----------->', _pace_resp);
            if (product_name == "MediCare" || product_name == "Medicare") {
                _sql = "insert into m_medicare_pacelog(quotation_no,proposal_no,policy_id,module_ref,api_name,api_request,api_response,status,info_msg,author,ip) VALUES (?,?,?,?,?,?,?,?,?,?,?)";
                _sql_res = await db.exec(_sql, [pdata['policy'].quote_no, pdata['policy'].proposal_no, pdata['policy'].policy_id, "PHONON REVERSEFEED", "PHONON REVERSEFEED", JSON.stringify(_pace_req), JSON.stringify(_pace_resp), "Success", "Called Successfully", this.author(), this.ip()]);
            } else if (product_name == "Medicare Plus") {
                _sql = "insert into m_medplus_pacelog(quotation_no,proposal_no,policy_id,module_ref,api_name,api_request,api_response,status,info_msg,author,ip) VALUES (?,?,?,?,?,?,?,?,?,?,?)";
                _sql_res = await db.exec(_sql, [pdata['policy'].quote_no, pdata['policy'].proposal_no, pdata['policy'].policy_id, "PHONON REVERSEFEED", "PHONON REVERSEFEED", JSON.stringify(_pace_req), JSON.stringify(_pace_resp), "Success", "Called Successfully", this.author(), this.ip()]);
            } else if (product_name == "Criti-Medicare") {
                _sql = "insert into cm_pacelog(quotation_no,proposal_no,policy_id,module_ref,api_name,api_request,api_response,status,info_msg,author,ip) VALUES (?,?,?,?,?,?,?,?,?,?,?)";
                _sql_res = await db.exec(_sql, [pdata['policy'].quote_no, pdata['policy'].proposal_no, pdata['policy'].policy_id, "PHONON REVERSEFEED", "PHONON REVERSEFEED", JSON.stringify(_pace_req), JSON.stringify(_pace_resp), "Success", "Called Successfully", this.author(), this.ip()]);
            }
        } catch (err) {
            //log the api with request & response  
            if (product_name == "MediCare" || product_name == "Medicare") {
                _sql = "insert into m_medicare_pacelog(quotation_no,proposal_no,policy_id,module_ref,api_name,api_request,api_response,status,info_msg,author,ip) VALUES (?,?,?,?,?,?,?,?,?,?,?)";
                _sql_res = await db.exec(_sql, [pdata['policy'].quote_no, pdata['policy'].proposal_no, pdata['policy'].policy_id, "PHONON REVERSEFEED", "PHONON REVERSEFEED", JSON.stringify(_pace_req), JSON.stringify(_pace_resp) + JSON.stringify(err), "Failed", "Failed-Catch Block", this.author(), this.ip()]);
            } else if (product_name == "Medicare Plus") {
                _sql = "insert into m_medplus_pacelog(quotation_no,proposal_no,policy_id,module_ref,api_name,api_request,api_response,status,info_msg,author,ip) VALUES (?,?,?,?,?,?,?,?,?,?,?)";
                _sql_res = await db.exec(_sql, [pdata['policy'].quote_no, pdata['policy'].proposal_no, pdata['policy'].policy_id, "PHONON REVERSEFEED", "PHONON REVERSEFEED", JSON.stringify(_pace_req), JSON.stringify(_pace_resp), "Success", "Called Successfully", this.author(), this.ip()]);
            } else if (product_name == "Criti-Medicare") {
                _sql = "insert into cm_pacelog(quotation_no,proposal_no,policy_id,module_ref,api_name,api_request,api_response,status,info_msg,author,ip) VALUES (?,?,?,?,?,?,?,?,?,?,?)";
                _sql_res = await db.exec(_sql, [pdata['policy'].quote_no, pdata['policy'].proposal_no, pdata['policy'].policy_id, "PHONON REVERSEFEED", "PHONON REVERSEFEED", JSON.stringify(_pace_req), JSON.stringify(_pace_resp), "Success", "Called Successfully", this.author(), this.ip()]);
            }
            pdata['policy'].pace_err_now = err;
            await imail.sendTemplatedEmail("varunprasath@godbtech.com,ranjana@godbtech.com,josephvijayakumar@godbtech.com,Vikas.Bharatwal@tataaig.com", pdata['policy'], 'mc_pace_mail', "tags", "")
            //return this.sendError(-102, "Exception in PACE Integration", err);

            return {
                status: -1
            };

        }
        return {
            status: 0
        };
    }

    async pace_json(polres) {
        var pol_json = {};
        var doc_details_len = [];
        var pay_details_len = [];
        var verify_details_len = [];
        var proposal_type = "";
        var prop_zone;
        var product_name = polres.proposal.data.product_name;
        var _sql, _sql_res;

        if (polres.proposal.data.proposer_zone != "" && polres.proposal.data.proposer_zone != undefined && polres.proposal.data.proposer_zone != null) {
            prop_zone = polres.proposal.data.proposer_zone;
        } else {
            prop_zone = "ZONE1";
        }
        try {
            if (polres.nstp_flag == "Yes") {
                proposal_type = "nSTP";
            } else if (polres.nstp_flag == "No" && polres.proposal.data.typeOfBusiness == "NB with Portability") {
                proposal_type = "STP Port";
            } else if (polres.nstp_flag == "Yes" && polres.proposal.data.typeOfBusiness == "NB with Portability") {
                proposal_type = "nSTP Port";
            } else {
                proposal_type = "STP";
            }
            if (product_name == "MediCare" || product_name == "Medicare") {
                pol_json = {
                    "status": 0,
                    "txt": "",
                    "data": [{
                        "policy_id": polres.policy_id,
                        "product_id": polres.product_id,
                        "policy_no": polres.policy_no,
                        "product_group_id": polres.product_group_id,
                        "par_product_id": polres.par_product_id,
                        "quote_id": polres.quote_id,
                        "proposal_id": polres.proposal_id,
                        "payment_id": polres.payment_id,
                        "quote_no": polres.quote_no,
                        "proposal_no": polres.proposal_no,
                        "u_ts": polres.c_ts,
                        "product_name": "Medicare",
                        "branch_code": polres.proposal.data.q_branch_code,
                        "branch": polres.proposal.data.q_branch_location,
                        "branch_name": polres.proposal.data.q_branch_location,
                        //"ntid": polres.created_by,
                        "user_name": polres.proposal.data.author,
                        "proposal_type": proposal_type,
                        "sol_id": "149",
                        "producer_name": polres.proposal.data.q_parentproducer_name,
                        "quote": {
                            "quote_id": polres.quote_id,
                            "quote_no": polres.quote_no,
                            "data": {
                                "product_id": polres.product_id,
                                "typeofbusiness": polres.quote.data.typeofbusiness,
                                "proposer_email": polres.proposal.data.proposer_email,
                                "proposer_state": polres.proposal.data.proposer_state,
                                "proposer_city": polres.proposal.data.proposer_city,
                                "proposer_mobile": polres.proposal.data.proposer_mobile,
                                "proposer_pincode": polres.proposal.data.proposer_pincode,
                                "q_producer_code": polres.proposal.data.q_producer_code,
                                "relation_1": polres.proposal.data.relation_1,
                                "relation_2": polres.proposal.data.relation_2,
                                "relation_3": polres.proposal.data.relation_3,
                                "relation_4": polres.proposal.data.relation_4,
                                "relation_5": polres.proposal.data.relation_5,
                                "relation_6": polres.proposal.data.relation_6,
                                "relation_7": polres.proposal.data.relation_7,
                                "si_1": polres.proposal.data.si_1,
                                "si_2": polres.proposal.data.si_2,
                                "si_3": polres.proposal.data.si_3,
                                "si_4": polres.proposal.data.si_4,
                                "si_5": polres.proposal.data.si_5,
                                "si_6": polres.proposal.data.si_6,
                                "si_7": polres.proposal.data.si_7,
                                "proposer_fullname": polres.proposal.data.proposer_fullname,
                                "premium_value": polres.proposal.data.premium_value,
                                "assigned_by": polres.proposal.data.assigned_by,
                            },
                        },
                        "proposal": {
                            "proposal_date": polres.proposal.proposal_date,
                            "data": {
                                "business_type": polres.proposal.data.business_type,
                                "refund_amount_tax": polres.proposal.data.refund_amount_tax,
                                "nstp_from_bucket_code": polres.proposal.data.nstp_from_bucket_code,
                                "nstp_from_stage_code": polres.proposal.data.nstp_from_stage_code,
                                "total_members": polres.proposal.data.total_members,
                                "proposer_partno": polres.proposal.data.proposer_partno,
                                "pol_si": polres.proposal.data.pol_si,
                                "proposer_nationality": polres.proposal.data.proposer_nationality,
                                "pace_code": polres.proposal.data.pace_code,
                                "proposer_add1": polres.proposal.data.proposer_add1,
                                "member_id_1": polres.proposal.data.member_id_1,
                                "member_id_2": polres.proposal.data.member_id_2,
                                "member_id_3": polres.proposal.data.member_id_3,
                                "member_id_4": polres.proposal.data.member_id_4,
                                "member_id_5": polres.proposal.data.member_id_5,
                                "member_id_6": polres.proposal.data.member_id_6,
                                "member_id_7": polres.proposal.data.member_id_7,
                                "last_name_1": polres.proposal.data.lname_1,
                                "last_name_2": polres.proposal.data.lname_2,
                                "last_name_3": polres.proposal.data.lname_3,
                                "last_name_4": polres.proposal.data.lname_4,
                                "last_name_5": polres.proposal.data.lname_5,
                                "last_name_6": polres.proposal.data.lname_6,
                                "last_name_7": polres.proposal.data.lname_7,
                                "first_name_1": polres.proposal.data.fname_1,
                                "first_name_2": polres.proposal.data.fname_2,
                                "first_name_3": polres.proposal.data.fname_3,
                                "first_name_4": polres.proposal.data.fname_4,
                                "first_name_5": polres.proposal.data.fname_5,
                                "first_name_6": polres.proposal.data.fname_6,
                                "first_name_7": polres.proposal.data.fname_7,
                                "proposer_zone": prop_zone,
                            }
                        },
                        "document": {
                            "document_id": polres.document_id,
                            "proposal_id": polres.proposal_id,
                            "data": {
                                "policy_id": polres.policy_id,
                                "verify_id": (polres.verify == undefined) ? "" : polres.verify.verify_id,
                            },
                            "details": [
                                // Sample structure
                                //     {
                                //       "document_details_id": "52435",
                                //       "document_id": polres.data[0].document.details.length,
                                //   "data": {
                                //         "document_details_id": ""
                                //     }
                                // }
                            ]
                        },
                        "payment": {
                            "payment_id": polres.payment_id,
                            "product_id": polres.product_id,
                            "data": {
                                "total_amount": polres.payment.total_amount,
                                "total_recvd": polres.payment.total_recvd,
                                "amount": polres.payment.data.amount,
                            },
                            "details": [
                                // demo Structure
                                //   {
                                //       "payment_details_id":"PD200000003367",
                                //       "payment_id":"PY200000030548",
                                //       "payment_type":"deposit",
                                //   "pay_date":"2021-05-11 10:16:09",
                                //   "premium_value":3764,
                                //   "paid_amount":3764,
                                //   "ifsc_code":"No",
                                //       "data":{
                                //  "amount":"3764",
                                //  "payer_type":"Customer",
                                //  "house_bank":"ICICI BANK LTD",
                                //  "payment_id":"PY200000030548"
                                //       }
                                //   }
                            ]
                        },
                        "verify": {
                            "data": {
                                "uploaded": [
                                    //   demo structure
                                    //   {
                                    //      "document_details_id":""
                                    //   }
                                ]
                            }
                        },
                        "policy": {
                            "data": {
                                "is_receipt_available": "Yes",
                                "receipt_details": []
                            }
                        }
                    }]

                }
            } else if (product_name == "Medicare Plus") {
                pol_json = {
                    "status": 0,
                    "txt": "",
                    "data": [{
                        "policy_id": polres.policy_id,
                        "product_id": polres.product_id,
                        "policy_no": polres.policy_no,
                        "product_group_id": polres.product_group_id,
                        "par_product_id": polres.par_product_id,
                        "quote_id": polres.quote_id,
                        "proposal_id": polres.proposal_id,
                        "payment_id": polres.payment_id,
                        "quote_no": polres.quote_no,
                        "proposal_no": polres.proposal_no,
                        "u_ts": polres.c_ts,
                        "branch": polres.proposal.data.q_branch_code,
                        "branch_name": polres.proposal.data.q_branch_location,
                        "product_name": "Medicare Plus",
                        //"ntid": "1234",
                        "user_name": polres.proposal.data.author,
                        "proposal_type": proposal_type,
                        "sol_id": "149",
                        "producer_name": polres.proposal.data.q_parentproducer_name,
                        "quote": {
                            "quote_id": polres.quote_id,
                            "quote_no": polres.quote_no,
                            "data": {
                                "product_id": polres.product_id,
                                "typeofbusiness": polres.proposal.data.typeOfBusiness,
                                "proposer_email": polres.proposal.data.proposer_email,
                                "proposer_state": polres.proposal.data.proposer_state,
                                "proposer_city": polres.proposal.data.proposer_city,
                                "proposer_mobile": polres.proposal.data.proposer_mobile,
                                "proposer_pincode": polres.proposal.data.proposer_pincode,
                                "q_producer_code": polres.proposal.data.q_producer_code,
                                "relation_1": polres.proposal.data.relation_1,
                                "relation_2": polres.proposal.data.relation_2,
                                "relation_3": polres.proposal.data.relation_3,
                                "relation_4": polres.proposal.data.relation_4,
                                "relation_5": polres.proposal.data.relation_5,
                                "relation_6": polres.proposal.data.relation_6,
                                "relation_7": polres.proposal.data.relation_7,
                                "si_1": polres.proposal.data.si_1,
                                "si_2": polres.proposal.data.si_2,
                                "si_3": polres.proposal.data.si_3,
                                "si_4": polres.proposal.data.si_4,
                                "si_5": polres.proposal.data.si_5,
                                "si_6": polres.proposal.data.si_6,
                                "si_7": polres.proposal.data.si_7,
                                "proposer_fullname": polres.proposal.data.proposer_fullname,
                                "premium_value": polres.proposal.data.premium_value,
                                "assigned_by": polres.proposal.data.assigned_by,
                            },
                        },
                        "proposal": {
                            "proposal_date": polres.proposal.proposal_date,
                            "data": {
                                "business_type": polres.proposal.data.business_type,
                                "refund_amount_tax": polres.proposal.data.refund_amount_tax,
                                "nstp_from_bucket_code": polres.proposal.data.nstp_from_bucket_code,
                                "nstp_from_stage_code": polres.proposal.data.nstp_from_stage_code,
                                "total_members": polres.proposal.data.total_members,
                                "proposer_partno": polres.proposal.data.proposer_partno,
                                "pol_si": polres.proposal.data.pol_si,
                                "proposer_nationality": polres.proposal.data.proposer_nationality,
                                "pace_code": polres.proposal.data.pace_code,
                                "proposer_add1": polres.proposal.data.proposer_add1,
                                "member_id_1": polres.proposal.data.member_id_1,
                                "member_id_2": polres.proposal.data.member_id_2,
                                "member_id_3": polres.proposal.data.member_id_3,
                                "member_id_4": polres.proposal.data.member_id_4,
                                "member_id_5": polres.proposal.data.member_id_5,
                                "member_id_6": polres.proposal.data.member_id_6,
                                "member_id_7": polres.proposal.data.member_id_7,
                                "last_name_1": polres.proposal.data.lname_1,
                                "last_name_2": polres.proposal.data.lname_2,
                                "last_name_3": polres.proposal.data.lname_3,
                                "last_name_4": polres.proposal.data.lname_4,
                                "last_name_5": polres.proposal.data.lname_5,
                                "last_name_6": polres.proposal.data.lname_6,
                                "last_name_7": polres.proposal.data.lname_7,
                                "first_name_1": polres.proposal.data.fname_1,
                                "first_name_2": polres.proposal.data.fname_2,
                                "first_name_3": polres.proposal.data.fname_3,
                                "first_name_4": polres.proposal.data.fname_4,
                                "first_name_5": polres.proposal.data.fname_5,
                                "first_name_6": polres.proposal.data.fname_6,
                                "first_name_7": polres.proposal.data.fname_7,
                            }
                        },
                        "document": {
                            "document_id": polres.document_id,
                            "proposal_id": polres.proposal_id,
                            "data": {
                                "policy_id": polres.policy_id,
                                "verify_id": polres.verify.verify_id,
                            },
                            "details": [
                                // Sample structure
                                //     {
                                //       "document_details_id": "52435",
                                //       "document_id": polres.data[0].document.details.length,
                                //   "data": {
                                //         "document_details_id": ""
                                //     }
                                // }
                            ]
                        },
                        "payment": {
                            "payment_id": polres.payment_id,
                            "product_id": polres.product_id,
                            "data": {
                                "total_amount": polres.payment.total_amount,
                                "total_recvd": polres.payment.total_recvd,
                                "amount": polres.payment.data.amount,
                            },
                            "details": [
                                // demo Structure
                                //   {
                                //       "payment_details_id":"PD200000003367",
                                //       "payment_id":"PY200000030548",
                                //       "payment_type":"deposit",
                                //   "pay_date":"2021-05-11 10:16:09",
                                //   "premium_value":3764,
                                //   "paid_amount":3764,
                                //   "ifsc_code":"No",
                                //       "data":{
                                //  "amount":"3764",
                                //  "payer_type":"Customer",
                                //  "house_bank":"ICICI BANK LTD",
                                //  "payment_id":"PY200000030548"
                                //       }
                                //   }
                            ]
                        },
                        "verify": {
                            "data": {
                                "uploaded": [
                                    //   demo structure
                                    //   {
                                    //      "document_details_id":""
                                    //   }
                                ]
                            }
                        },
                        "policy": {
                            "data": {
                                "is_receipt_available": "Yes",
                                "receipt_details": []
                            }
                        }
                    }]

                }
            } else if (product_name == "Criti-Medicare") {
                pol_json = {
                    "status": 0,
                    "txt": "",
                    "data": [{
                        "policy_id": polres.policy_id,
                        "product_id": polres.product_id,
                        "policy_no": polres.policy_no,
                        "product_group_id": polres.product_group_id,
                        "par_product_id": polres.par_product_id,
                        "quote_id": polres.quote_id,
                        "proposal_id": polres.proposal_id,
                        "payment_id": polres.payment_id,
                        "quote_no": polres.quote_no,
                        //"product_name": "Criti-Medicare",
                        "proposal_no": polres.proposal_no,
                        "u_ts": polres.c_ts,
                        "quote": {
                            "quote_id": polres.quote_id,
                            "quote_no": polres.quote_no,
                            "data": {
                                "product_id": polres.product_id,
                                "typeofbusiness": polres.quote.data.typeofbusiness,
                                "proposer_email": polres.proposal.data.proposer_email,
                                "proposer_state": polres.proposal.data.proposer_state,
                                "proposer_city": polres.proposal.data.proposer_city,
                                "proposer_mobile": polres.proposal.data.proposer_mobile,
                                "proposer_pincode": polres.proposal.data.proposer_pincode,
                                "q_producer_code": polres.proposal.data.q_producer_code,
                                "relation_1": polres.proposal.data.relation_1,
                                "relation_2": polres.proposal.data.relation_2,
                                "relation_3": polres.proposal.data.relation_3,
                                "relation_4": polres.proposal.data.relation_4,
                                "relation_5": polres.proposal.data.relation_5,
                                "relation_6": polres.proposal.data.relation_6,
                                "relation_7": polres.proposal.data.relation_7,
                                "max_si_1": polres.proposal.data.max_si_1,
                                "max_si_2": polres.proposal.data.max_si_2,
                                "max_si_3": polres.proposal.data.max_si_3,
                                "max_si_4": polres.proposal.data.max_si_4,
                                "max_si_5": polres.proposal.data.max_si_5,
                                "max_si_6": polres.proposal.data.max_si_6,
                                "max_si_7": polres.proposal.data.max_si_7,
                                "proposer_fullname": polres.proposal.data.proposer_fullname,
                                "premium_value": polres.proposal.data.premium_value,
                                "assigned_by": polres.proposal.data.assigned_by,
                            },
                        },
                        "proposal": {
                            "proposal_date": polres.proposal.proposal_date,
                            "data": {
                                "business_type": polres.proposal.data.business_type,
                                "refund_amount_tax": polres.proposal.data.refund_amount_tax,
                                "nstp_from_bucket_code": polres.proposal.data.nstp_from_bucket_code,
                                "nstp_from_stage_code": polres.proposal.data.nstp_from_stage_code,
                                "total_members": polres.proposal.data.total_members,
                                "proposer_partno": polres.proposal.data.proposer_partno,
                                "pol_si": polres.proposal.data.pol_si,
                                "proposer_nationality": "Indian", //field not captured in criticare
                                "pace_code": polres.proposal.data.pace_code,
                                "proposer_add1": polres.proposal.data.proposer_add1,
                                "member_id_1": polres.proposal.data.member_id_1,
                                "member_id_2": polres.proposal.data.member_id_2,
                                "member_id_3": polres.proposal.data.member_id_3,
                                "member_id_4": polres.proposal.data.member_id_4,
                                "member_id_5": polres.proposal.data.member_id_5,
                                "member_id_6": polres.proposal.data.member_id_5,
                                "member_id_7": polres.proposal.data.member_id_7,
                                "last_name_1": polres.proposal.data.lname_1,
                                "last_name_2": polres.proposal.data.lname_2,
                                "last_name_3": polres.proposal.data.lname_3,
                                "last_name_4": polres.proposal.data.lname_4,
                                "last_name_5": polres.proposal.data.lname_5,
                                "last_name_6": polres.proposal.data.lname_6,
                                "last_name_7": polres.proposal.data.lname_7,
                                "first_name_1": polres.proposal.data.fname_1,
                                "first_name_2": polres.proposal.data.fname_2,
                                "first_name_3": polres.proposal.data.fname_3,
                                "first_name_4": polres.proposal.data.fname_4,
                                "first_name_5": polres.proposal.data.fname_5,
                                "first_name_6": polres.proposal.data.fname_6,
                                "first_name_7": polres.proposal.data.fname_7,
                            }
                        },
                        "document": {
                            "document_id": polres.document_id,
                            "proposal_id": polres.proposal_id,
                            "data": {
                                "policy_id": polres.policy_id,
                                "verify_id": polres.verify.verify_id,
                            },
                            "details": []
                        },
                        "payment": {
                            "payment_id": polres.payment_id,
                            "product_id": polres.product_id,
                            "data": {
                                "total_amount": polres.payment.total_amount,
                                "total_recvd": polres.payment.total_recvd,
                                "amount": polres.payment.data.amount,
                            },
                            "details": []
                        },
                        "verify": {
                            "data": {
                                "uploaded": []
                            }
                        },
                        "policy": {
                            "data": {
                                "is_receipt_available": "Yes",
                                "receipt_details": []
                            }
                        }
                    }]

                }
            }

            let _exception = "";
            try {
                doc_details_len = polres.document.details.length;
                pay_details_len = polres.payment.details.length;
                verify_details_len = polres.verify.data.uploaded.length;
            } catch (ex) {
                _exception = "Error while fetching Payment details";
                if (product_name == "MediCare" || product_name == "Medicare") {
                    _sql = "insert into m_medicare_pacelog(quotation_no,proposal_no,policy_id,module_ref,api_name,api_request,api_response,status,info_msg,author,ip) VALUES (?,?,?,?,?,?,?,?,?,?,?)";
                    _sql_res = await db.exec(_sql, [polres.quote_no, polres.proposal_no, polres.policy_id, "PACE CALL-TelemerEtoE API", "PACE-REALTIME API-REQUEST", JSON.stringify(pol_json), JSON.stringify(_exception + polres + ex), "Failed", "PACE API Request Framing Failed", this.author(), this.ip()]);
                } else if (product_name == "Medicare Plus") {
                    _sql = "insert into m_medplus_pacelog(quotation_no,proposal_no,policy_id,module_ref,api_name,api_request,api_response,status,info_msg,author,ip) VALUES (?,?,?,?,?,?,?,?,?,?,?)";
                    _sql_res = await db.exec(_sql, [polres.quote_no, polres.proposal_no, polres.policy_id, "PACE CALL-TelemerEtoE API", "PACE-REALTIME API-REQUEST", JSON.stringify(pol_json), JSON.stringify(_exception + polres + ex), "Failed", "PACE API Request Framing Failed", this.author(), this.ip()]);
                } else if (product_name == "Criti-Medicare") {
                    _sql = "insert into m_medplus_pacelog(quotation_no,proposal_no,policy_id,module_ref,api_name,api_request,api_response,status,info_msg,author,ip) VALUES (?,?,?,?,?,?,?,?,?,?,?)";
                    _sql_res = await db.exec(_sql, [polres.quote_no, polres.proposal_no, polres.policy_id, "PACE CALL-TelemerEtoE API", "PACE-REALTIME API-REQUEST", JSON.stringify(pol_json), JSON.stringify(_exception + polres + ex), "Failed", "PACE API Request Framing Failed", this.author(), this.ip()]);
                }
            } finally {

            }


            // For document details
            if (doc_details_len > 0) {
                for (let i = 0; i < doc_details_len; i++) {
                    pol_json.data[0].document.details.push({
                        "document_details_id": polres.document.details[i].document_details_id,
                        "document_id": polres.document_id,
                        "data": {
                            "document_details_id": polres.document.details[i].document_details_id
                        }
                    })
                }

            } else {
                pol_json.data[0].document.details.push({
                    "document_details_id": "",
                    "document_id": polres.document_id,
                    "data": {
                        "document_details_id": ""
                    }
                })
            }

            // for payment details
            if (pay_details_len > 0) {
                for (let i = 0; i < pay_details_len; i++) {
                    pol_json.data[0].payment.details.push({
                        "payment_details_id": polres.payment.details[i].payment_details_id,
                        "payment_id": polres.payment.payment_id,
                        "payment_type": polres.payment.details[i].payment_type,
                        "pay_date": polres.payment.details[i].pay_date,
                        "premium_value": polres.payment.premium_value,
                        "paid_amount": polres.payment.details[i].paid_amount,
                        "ifsc_code": "",
                        "data": {
                            "amount": polres.payment.details[i].data.amount,
                            "payer_type": polres.payment.details[i].data.payer_type,
                            "house_bank": polres.payment.details[i].data.house_bank,
                            "payment_id": polres.payment.payment_id
                        }
                    })
                }
            } else {
                //not required because proposal will sync to pace only after payment
            }

            // For verify details
            if (verify_details_len > 0) {
                for (let i = 0; i < verify_details_len; i++) {
                    pol_json.data[0].verify.data.uploaded.push({
                        "document_details_id": polres.verify.data.uploaded[i].document_details_id
                    })
                }
            } else {
                pol_json.data[0].verify.data.uploaded.push({
                    "document_details_id": ""
                })
            }

            //Below if condition added for CR raised by Bipro/Vikram on 01/02/2022
            // For receipt details
            if (pay_details_len > 0) {
                // var pay_id=polres.payment.details[0].payment_details_id;
                for (let i = 0; i < pay_details_len; i++) {

                    var id = polres.payment.details[i].payment_details_id
                    pol_json.data[0].policy.data.receipt_details.push({
                        "payment_details_id": polres.payment.details[i].payment_details_id ? polres.payment.details[i].payment_details_id : "",

                        "receipt_no": (polres.data.receipt_details == undefined) ? '' : polres.data.receipt_details[0][id].receipt_no,
                        //"receipt_no": polres.payment.details[i].payment_details_no ? polres.payment.details[i].payment_details_no: "",
                        "receipt_date": (polres.payment.details[i].payment_details_date == undefined) ? '' : polres.payment.details[i].payment_details_date
                    })
                }
            } else {

            }
        } catch (ex) {
            if (product_name == "MediCare" || product_name == "Medicare") {
                _sql = "insert into m_medicare_pacelog(quotation_no,proposal_no,policy_id,module_ref,api_name,api_request,api_response,status,info_msg,author,ip) VALUES (?,?,?,?,?,?,?,?,?,?,?)";
                _sql_res = await db.exec(_sql, [polres.quote_no, polres.proposal_no, polres.policy_id, "PACE REAL TIME CALL REQUEST", "PACE-REALTIME API REQUEST", JSON.stringify(pol_json), JSON.stringify(ex + polres), "Failed", "PACE API Request Failed", this.author(), this.ip()]);
            } else if (product_name == "Medicare Plus") {
                _sql = "insert into m_medplus_pacelog(quotation_no,proposal_no,policy_id,module_ref,api_name,api_request,api_response,status,info_msg,author,ip) VALUES (?,?,?,?,?,?,?,?,?,?,?)";
                _sql_res = await db.exec(_sql, [polres.quote_no, polres.proposal_no, polres.policy_id, "PACE REAL TIME CALL REQUEST", "PACE-REALTIME API REQUEST", JSON.stringify(pol_json), JSON.stringify(ex + polres), "Failed", "PACE API Request Failed", this.author(), this.ip()]);
            } else if (product_name == "Criti-Medicare") {
                _sql = "insert into m_medplus_pacelog(quotation_no,proposal_no,policy_id,module_ref,api_name,api_request,api_response,status,info_msg,author,ip) VALUES (?,?,?,?,?,?,?,?,?,?,?)";
                _sql_res = await db.exec(_sql, [polres.quote_no, polres.proposal_no, polres.policy_id, "PACE REAL TIME CALL REQUEST", "PACE-REALTIME API REQUEST", JSON.stringify(pol_json), JSON.stringify(ex + polres), "Failed", "PACE API Request Failed", this.author(), this.ip()]);
            }
        }
        return pol_json
    }

    async trig_mail(Propresponse) {
        try {
            var token = this.req.headers["in-auth-token"];
            var resData;
            var req_log;
            console.log("----Call trigger mail----")
            var product_name = Propresponse.data[0].quote.data.product_name;
            var url;

            //if(product_name == "MediCare" || product_name == "Medicare"){
            url = `https://${conf.app.domain}/api/v1/mc_nstp_api/trig_mail/` + Propresponse.data[0].policy_id;
            //}
            // else if (product_name == "Medicare Plus"){
            //     url = `https://${conf.app.domain}/api/v1/mp_nstp_api/trig_mail/` + Propresponse.data[0].policy_id;
            // }
            // else if (product_name == "Criti-Medicare"){
            //     url = `https://${conf.app.domain}/api/v1/cc_nstp_api/trig_mail/` + Propresponse.data[0].policy_id;  
            // }
            console.log("URL :: ", url);
            req_log = url;
            let headers = { 'in-auth-token': token, 'Content-Type': 'application/json' };
            console.log("Header :: ", headers);
            let response = await this.apost(url, null, headers).then(async function (_Response) {
                var _resp = _Response;
                resData = _resp;
                console.log("----TRIGGER MAIL SUCCESS----", resData);

            });

            var responsedata = JSON.parse(resData);
            if (responsedata.status == 0) {
                return true;
            } else {
                await this.submit_log(Propresponse.data[0].proposal_no, "trigger mail failed", url, responsedata);
                return this.sendError(-102, "trigger mail failed", responsedata.txt);
            }
        } catch (ex) {
            await this.submit_log(Propresponse.data[0].proposal_no, "trigger mail failed", url, ex);
        }
    }

    async submit_log(proposalno, apistatus, req, res) {
        let policy;
        if (proposalno != "") {
            let _fresh_policy = await this._one_policy({ proposal_no: proposalno }, true);
            policy = _fresh_policy;
        }
        if (apistatus == "Success") {
            //let _sql = "insert into medicare_error_log(quotation_no,proposal_no,policy_id,module_ref,api_name,api_request,api_response,status,info_msg,author,ip) VALUES (?,?,?,?,?,?,?,?,?,?,?)";
            //let _sql_res = await db.exec(_sql, [policy.quote_no, policy.proposal_no, policy.policy_id, "Phonon API", apistatus, JSON.stringify(req), "Proposal Submitted Successfully", "Success", "Success", this.author(), this.ip()]);

            let _sql = "insert into health_phononlog(product_name,product_code,quotation_no,proposal_no,policy_id,module_ref,api_name,api_request,api_response,status,info_msg,author,ip) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)";
            let _sql_res = await db.exec(_sql, [policy.quote.data.product_name, policy.data.product_code, policy.quote_no, policy.proposal_no, policy.policy_id, "Phonon API", apistatus, JSON.stringify(req), JSON.stringify(res), "Proposal Submitted Successfully", "Success", "Success", this.author(), this.ip()]);


        } else {
            if (proposalno == "") {
                policy.quote_no = "NA"
                policy.proposal_no = "NA"
                policy.policy_id = "NA"
            }
            //let _sql = "insert into medicare_error_log(quotation_no,proposal_no,policy_id,module_ref,api_name,api_request,api_response,status,info_msg,author,ip) VALUES (?,?,?,?,?,?,?,?,?,?,?)";
            //let _sql_res = await db.exec(_sql, [policy.quote_no, policy.proposal_no, policy.policy_id, "Phonon API", apistatus, JSON.stringify(req), JSON.stringify(res), "Failed", "Failed-Catch Block", this.author(), this.ip()]);

            let _sql = "insert into health_phononlog(product_name,product_code,quotation_no,proposal_no,policy_id,module_ref,api_name,api_request,api_response,status,info_msg,author,ip) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)";
            let _sql_res = await db.exec(_sql, [policy.quote.data.product_name, policy.data.product_code, policy.quote_no, policy.proposal_no, policy.policy_id, "Phonon API", apistatus, JSON.stringify(req), JSON.stringify(res), "Failed", "Failed-Catch Block", this.author(), this.ip()]);

        }
    }

    async random_id() {
        var chars = '0123456789'.split('');
        var result = '';
        for (var i = 0; i < 6; i++) {
            var x = Math.floor(Math.random() * chars.length);
            result += chars[x];
        }
        return result;
    }

    async apost(url, brerequest, headers) {
        return new Promise((resolve, reject) => {
            var options = {
                url: url,
                body: brerequest
            };
            if (headers)
                options.headers = headers;
            request.post(options, (err, resp, body) => {
                if (err)
                    return reject(err);
                else if (resp && resp.statusCode != 200 && resp.statusCode != 204)
                    return reject(resp.statusCode + ' ' + body);
                else
                    return resolve(body);
            });
        });
    }
}
module.exports = phononreversefeed;
