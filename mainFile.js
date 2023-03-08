async function pace_json(polres) {
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
                                // "typeofbusiness": polres.quote.data.typeofbusiness,
                                "typeofbusiness": polres.proposal.data.business_type != 'Renewal' ? polres.quote.data.typeofbusiness : polres.proposal.data.business_type,
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
