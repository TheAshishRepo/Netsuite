/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 */

/*
Name                : ay_mr_fetch_zd_data.js
Purpose             : Map/Reduce Script to fetch Bill To and CLient creation data from Zendesk tickets
Created On          : 04/27/2020
Script Type         : Map/Reduce
Changelog           : Initial Development - 04/27/2020
*/
// testing on 10/28
define(['N/file', 'N/search', 'N/runtime', 'N/https', 'N/encode', 'N/record', 'N/email', 'N/crypto', 'N/task'],
    function (file, search, runtime, https, encode, record, email, crypto, task) {

    var TICKET_COMMENT_URL = 'https://avisonyoung.zendesk.com/api/v2/tickets/{TICKET_ID}/comments.json';
    var SUBSIDIARY_UPDATE_SCRIPT_ID = 'customscript_ay_map_bill_to';
    var SUBSIDIARY_UPDATE_DEPLOYMENT_ID = 'customdeploy_billto_manual';

    /*
     * Function to get the input for the Map and Reduce stage
     * This function authenticates Zendesk login and fetches all the open tickets from the Bill to and client setup view
    */
    function getInputData() {

        var VIEW_URL = runtime.getCurrentScript().getParameter({name: 'custscript_zendesk_view_url'});
        var autho = GetAuthenticationHeaders();
        
        var ticketsArr = fetchTicketsFromView(VIEW_URL, autho);
        
        //ticketsArr.push(8492);  //FOR TESTING PURPOSE ONLY. REMOVE ONCE TESTED
        log.debug('Tickets arr after 8492', ticketsArr);
        return ticketsArr;
    }

    /*
     * Map function
     * Each instance of the Map executes one Zendesk ticket
     * Authenticates the Zendesk login and fetches the valid CSV attachment per ticket
     * Passes the ticket:attachment data to the Reduce stage
    */
    function map(context) {

        log.debug('map data',context.value);
        var ticketId = JSON.parse(context.value);

        var autho = GetAuthenticationHeaders();
        var attachment = fetchTicketAttachments(TICKET_COMMENT_URL, autho, ticketId);

        log.debug('Attachment: ', attachment);
        
        //writing the ticket ID and it's attachemnt ID data to the Reduce stage
        context.write({
            key: ticketId, 
            value: attachment
        });
    }

    /*
     * Reduce function
     * Each instance of the Reduce executes one Zendesk ticket and it's attachment
     * Authenticates the Zendesk login and fetches the file conetents of the attachment
     * Reads the file content, validates, checks for duplictes and creates the Bill To and Client records
    */
    function reduce(context) {

        log.debug('Reduce context: ', context);
        log.debug('reduce data',context.values);
        log.debug('reduce keys: ', context.key);

        
        var contentURL = '';
        var failedRecordNames = [];

        //If no attachemnts, add the ticket ID to the failed tickets list
        if(context.values[0] === 'No Valid Attachment found'){
            context.write({
                key: 'Failed', 
                value: context.key
            });
        }
        else{
            contentURL = context.values[0];
            var autho = GetAuthenticationHeaders();
    
            var response = https.request({
                method: https.Method.GET,
                url: contentURL,
                headers: autho
            });
    
            var fileContents = response.body;
            log.debug('File Contents: ', fileContents);

            //convert the file contents from BASE_64 encoding to Plain text
            var fileContentsDecoded = encode.convert({
                string: fileContents,
                inputEncoding: encode.Encoding.BASE_64,
                outputEncoding: encode.Encoding.UTF_8
            });
            log.debug('Decoded file contents: ', fileContentsDecoded);
            
            //splitting each line of the CSV
            var line = fileContentsDecoded.split("\n");
            var lineCount = line.length;
            log.debug('Line count in reduce: ', lineCount);

            //processing each line of the CSV as a separate record starting from third line. First 2 lines are headers 
            for (var i = 2; i < lineCount - 1; i++) { 
                
                var fileContent = CSVtoArray(line[i]);
                
                //mapping the different CSV columns
                var billToClientFlag = fileContent[0];
                var individualOrCompany = fileContent[1];
                var companyName = fileContent[2];
                var email = fileContent[3];
                var phone = fileContent[4];
                var comment = fileContent[5];
                var attention = fileContent[9];
                var address1 = fileContent[10];
                var address2 = fileContent[11];
                var city = fileContent[12];
                var state = fileContent[13];
                var country = fileContent[14];
                var zip = fileContent[15];
                var clientAddress = fileContent[16];
                
                //bill to creation request
                if((billToClientFlag.toLowerCase() == 'only bill to' || billToClientFlag.toLowerCase() == 'bill to and client') && companyName){
                    log.debug('Inside bill to creation');

                    //do not create record and report error if both address1 and address2 are missing
                    if(companyName && !address1 && !address2){
                        failedRecordNames.push(companyName + ' --> ' + "Bill To address missing");
                        log.debug("Address missing");
                    }
                    else{
                        try{

                            //search for duplicate records first
                            var filters = [];
                            var columns = [];

                            var isPersonFilter = '';
                            if(individualOrCompany.toLowerCase() == 'individual'){
                                isPersonFilter = 'T';
                            }
                            else{
                                isPersonFilter = 'F';
                            }
                            filters.push(["isperson","is",isPersonFilter]);
                            filters.push('AND');
                            if(isPersonFilter == 'F'){
                                filters.push(["companyname","is",companyName.trim()]);
                            }
                            else{

                                filters.push(["entityid","is",companyName.trim()]);
                            }
                            

                            columns.push(search.createColumn({name: "internalid", label: "Internal ID"}));
                            columns.push(search.createColumn({name: "address1", label: "Address 1"}));
                            columns.push(search.createColumn({name: "address2", label: "Address 2"}));
                            columns.push(search.createColumn({name: "city", label: "City"}));
                            columns.push(search.createColumn({name: "state", label: "State"}));
                            columns.push(search.createColumn({name: "zipcode", label: "ZIP"}));
                            log.debug("Filters: ", filters.toString());

                            //search for Bill Tos with the same name
                            var customerSearchObj = search.create({
                                type: "customer",
                                filters: filters,
                                columns: columns
                            });

                            var customerSearchCount = customerSearchObj.runPaged().count;
                            log.debug("searchObj result count",customerSearchCount);
                            
                            if(customerSearchCount > 0){
                                var searchResult = customerSearchObj.run().getRange({
                                    start: 0,
                                    end: 100
                                });

                                var addressMatched = false;

                                //looping through each of the Bill Tos found with same name and checking for address match
                                for(var j = 0; j < searchResult.length; j++){

                                    //creating the address string from the search result address
                                    var addressStr = '';
                                    var inputAddressStr = '';
                                    var addr1Str = searchResult[j].getValue({ name: 'address1' });
                                    if(addr1Str){
                                        addressStr += addr1Str;
                                    }
                                    var addr2Str = searchResult[j].getValue({ name: 'address2' });
                                    if(addr2Str){
                                        addressStr += ' ' + addr2Str;
                                    }
                                    var cityStr = searchResult[j].getValue({ name: 'city' });
                                    if(cityStr){
                                        addressStr += ' ' + cityStr;
                                    }
                                    var zipStr = searchResult[j].getValue({ name: 'zipcode' });
                                    if(zipStr){
                                        addressStr += ' ' + zipStr;
                                    }
                                    log.debug("Result address str: ", addressStr);
                                    var internalID = searchResult[j].getValue({
                                        name: 'internalid'
                                    });
                                    log.debug('Cust duplicate name internal ID: ', internalID);

                                    //creating the address string from the user input
                                    if(address1){
                                        inputAddressStr =  inputAddressStr + address1;
                                    }
                                    if(address2){
                                        inputAddressStr = inputAddressStr + ' ' + address2;
                                    }
                                    if(city){
                                        inputAddressStr = inputAddressStr + ' ' + city;
                                    }
                                    if(zip){
                                        inputAddressStr = inputAddressStr + ' ' + zip;
                                    }
                                    log.debug("Input address str : ", inputAddressStr);

                                    //comparing both the addresses
                                    if(CompareAddress(addressStr, inputAddressStr)){

                                        //addresses matched
                                        addressMatched = true;
                                        break;
                                    }
                                }
                                
                                //both name and address matched. Exact duplicate record
                                if(addressMatched){
                                    failedRecordNames.push(companyName + ' --> ' + "Duplicate Bill To. Record Skipped");
                                    log.debug("Exact Duplicate Bill To found");
                                }

                                //only name matched, not address. Address has to be appended
                                else{

                                    //Update the first search result with the address
                                    var recordID = searchResult[0].getValue({
                                        name: 'internalid'
                                    });
                                    var billToRecord = record.load({
                                        type: 'customer',
                                        id: recordID,
                                        isDynamic: true
                                    });

                                    if(address1 || address2){
                                        //Add another line to sublist  
                                        billToRecord.selectNewLine({ sublistId: 'addressbook' });
                                        //create address subrecord
                                        var subRecord = billToRecord.getCurrentSublistSubrecord({
                                            sublistId: 'addressbook',
                                            fieldId: 'addressbookaddress'
                                        });
                
                                        if(country) {
                                            if(country.toLowerCase() == 'usa' || country.toLowerCase() == 'united states'){
                                                country = 'US';
                                            }
                                            else if(country.toLowerCase() == 'canada'){
                                                country = 'CA';
                                            }
                                            subRecord.setValue('country', country); //Country must be set before setting the other address fields
                                        }
                                        if(attention) {
                                            subRecord.setValue('attention',attention);
                                        }
                                        if(companyName) {
                                            subRecord.setValue('addressee', companyName);
                                        }
                                        if(address1) {
                                            subRecord.setValue('addr1', address1);
                                        }
                                        if(address2) {
                                            subRecord.setValue('addr2', address2);
                                        }
                                        if(city) {
                                            subRecord.setValue('city',city);
                                        }
                                        if(state && state.length == 2) {
                                            subRecord.setValue('dropdownstate',state);
                                        }
                                        else if(state && state.length > 2){
                                            subRecord.setText('dropdownstate',state);
                                        }
                                        if(zip) {
                                            subRecord.setValue('zip', zip);
                                        }
                                        
                                        billToRecord.commitLine({ sublistId: 'addressbook' });
                                    
                                    }
                                    var billToRecordId = billToRecord.save();
                                    log.debug('billToRecordId updated with new address',billToRecordId);

                                }
                                
                            }

                            //neither name not address matched. Create a new record
                            else{
                                var billToRecord = record.create({
                                    type: 'customer',
                                    isDynamic: true
                                });
                            
                                
                                if(individualOrCompany.toLowerCase() == 'individual') {
                                    var nameSplitArr = companyName.split(" ");
                                    var firstName = '';
                                    var lastName = '';
                                    for(var word = 0; word < nameSplitArr.length - 1; word++){
                                        firstName = firstName + nameSplitArr[word] + ' ';
                                    }
                                    lastName = nameSplitArr[nameSplitArr.length - 1];
                                    log.debug('Firstname : ', firstName);
                                    log.debug('Lastname: ', lastName);
                                    billToRecord.setValue('isperson', 'T');
                                    billToRecord.setValue('firstname', firstName);
                                    billToRecord.setValue('lastname', lastName);
                                }
                                else{
                                    billToRecord.setValue('isperson', 'F');
                                    billToRecord.setValue('companyname', companyName);
                                }     
        
                                billToRecord.setValue('subsidiary', 1); //ALWAYS SET THE TOP-LEVEL SUBSIDIARY
                                billToRecord.setValue('custentity_ay_entity_scope', 1); //ALWAYS SET AS GLOBAL
                                billToRecord.setValue('custentity_execute_ay_map', true);
            
                                if(email) {
                                    billToRecord.setValue('email', email);
                                }
            
                                if(phone) {
                                    billToRecord.setValue('phone', phone);
                                }
            
                                /*if(comment) {
                                    billToRecord.setValue('phone', comment);
                                }*/
            
                                if(address1 || address2) {
            
                                    //Add first line to sublist  
                                    billToRecord.selectNewLine({ sublistId: 'addressbook' });
                                    billToRecord.setCurrentSublistValue({ 
                                        sublistId: 'addressbook',
                                        fieldId: 'defaultshipping',
                                        value: true
                                    });  
                                    billToRecord.setCurrentSublistValue({ 
                                        sublistId: 'addressbook',
                                        fieldId: 'defaultbilling',
                                        value: true
                                    });
                                
                                    //create address subrecord
                                    var subRecord = billToRecord.getCurrentSublistSubrecord({
                                        sublistId: 'addressbook',
                                        fieldId: 'addressbookaddress'
                                    });
            
                                    if(country) {
                                        if(country.toLowerCase() == 'usa' || country.toLowerCase() == 'united states'){
                                            country = 'US';
                                        }
                                        else if(country.toLowerCase() == 'canada'){
                                            country = 'CA';
                                        }
                                        subRecord.setValue('country', country); //Country must be set before setting the other address fields
                                    }
                                    if(attention) {
                                        subRecord.setValue('attention',attention);
                                    }
                                    if(companyName) {
                                        subRecord.setValue('addressee', companyName);
                                    }
                                    if(address1) {
                                        subRecord.setValue('addr1', address1);
                                    }
                                    if(address2) {
                                        subRecord.setValue('addr2', address2);
                                    }
                                    if(city) {
                                        subRecord.setValue('city',city);
                                    }
                                    if(state && state.length == 2) {
                                        subRecord.setValue('dropdownstate',state);
                                    }
                                    else if(state && state.length > 2){
                                        subRecord.setText('dropdownstate',state);
                                    }
                                    if(zip) {
                                        subRecord.setValue('zip', zip);
                                    }
                                    
                                    billToRecord.commitLine({ sublistId: 'addressbook' });
                                }
            
                                var billToRecordId = billToRecord.save();
                                log.debug('billToRecordId',billToRecordId);
                            }

                        }
                        catch(ex){
                            log.debug("Error: ", ex.toString());
                            failedRecordNames.push(companyName + ' --> ' + ex.message);
                        }
                    }
                    
                }

                //client creation request
                if((billToClientFlag.toLowerCase() == 'only client' || billToClientFlag.toLowerCase() == 'bill to and client') && companyName){

                    if(companyName && !clientAddress){
                        failedRecordNames.push(companyName + ' --> ' + "Client address missing");
                        log.debug("Address missing for client");
                    }
                    else{
                        try{

                            //search for duplicate check with cliet name and address
                            var filters = [];
                            var columns = [];
                            filters.push(["name","is",companyName]);
                            if(clientAddress){ 
                                filters.push('AND');
                                filters.push(["custrecord_client_address","is",clientAddress]);
                            }
                            

                            columns.push(search.createColumn({name: "internalid", label: "Internal ID"}));

                            var clientSearchObj = search.create({
                                type: "customrecord_client",
                                filters: filters,
                                columns: columns
                            });

                            var clientSearchCount = clientSearchObj.runPaged().count;
                            log.debug("searchObj result count",clientSearchCount);
                            
                            //duplicate found
                            if(clientSearchCount > 0){
                                var searchResult = clientSearchObj.run().getRange({
                                    start: 0,
                                    end: 1
                                });
                                var internalID = searchResult[0].getValue({
                                    name: 'internalid'
                                });
                                log.debug('Client internal ID: ', internalID);
                                failedRecordNames.push(companyName + ' --> ' + "Duplicate Client. Record Skipped");
                            }

                            //not duplicate. create new record
                            else{
                                var clientRecord = record.create({
                                    type: 'customrecord_client',
                                    isDynamic: true
                                });
                                
                                clientRecord.setValue('altname', companyName);
                                if(phone){
                                    clientRecord.setValue('custrecord_client_phone_number',phone);
                                }
                                if(email){
                                    clientRecord.setValue('custrecord_client_email_address',email);
                                }
                                if(clientAddress){
                                    clientRecord.setValue('custrecord_client_address',clientAddress);
                                }
                                var clientRecordId = clientRecord.save();
                                log.debug('Client Record ID: ', clientRecordId);
                            }    
                        }
                        catch(ex){
                            log.debug("Error: ", ex.toString());
                            failedRecordNames.push(companyName + ' --> ' + ex.message);
                        }
                    }
                }

                if((!billToClientFlag || (billToClientFlag && billToClientFlag.toLowerCase() != 'only client' && billToClientFlag.toLowerCase() != 'bill to and client' && billToClientFlag.toLowerCase() != 'only bill to')) && companyName){
                    
                    //missing the value for Bill To/Client column
                    failedRecordNames.push(companyName + ' --> ' + "Missing data for Column A (Bill To or Client?)");
                }

    
            }
            if(failedRecordNames.length > 0){
                context.write({
                    key: context.key,
                    value: failedRecordNames
                });
            }
            else{
                context.write({
                    key: 'Passed',
                    value: context.key
                });
            }
        }
    }

    /*
    * Summarize function
    * Emails the summary of tickets passed, tickets failed
    */
    function summarize(context) {

        log.debug('Summarize context: ', context);
        var noAttachmentsArr = [];
        var billToCreationFailed = [];
        var passedTickets = [];
        var count = 0;
        context.output.iterator().each(function (key, value){
            
            log.debug({
                title: 'summary.output.iterator', 
                details: 'key: ' + key + ' / value: ' + value
            });
            if(key === 'Failed'){
                noAttachmentsArr.push(value);
            }
            else if(key === 'Passed'){
                passedTickets.push(value);
            }
            else{
                billToCreationFailed[count] = {'ticket': key, 'companyname': value};
                count = count + 1;
            }
            
            return true;
        });
        log.debug("No attachment Tickets: ", noAttachmentsArr);
        log.debug("Passed tickets: ", passedTickets);
        log.debug("Record creation failed tickets: ", billToCreationFailed);
        var senderEmail = runtime.getCurrentScript().getParameter({name: 'custscript_billto_email_sender_id'});
        var emails = runtime.getCurrentScript().getParameter({name: 'custscript_report_recipient_emails'});
        emails = emails.split(",");
        var emailBody = 'Tickets with no/invalid attachments: ' + noAttachmentsArr + '<br />';
        emailBody = emailBody + 'Tickets Passed: ' + passedTickets + '<br />';
        emailBody = emailBody + 'Tickets which failed during record creation: ' + JSON.stringify(billToCreationFailed) + '<br />'; 

        email.send({
            author: senderEmail,
            recipients: emails,
            subject: 'Bill To / Client Creation Report',
            body: emailBody
        });

        //trigger the subsidiary update script
        var mrTask = task.create({
            taskType: task.TaskType.MAP_REDUCE,
            scriptId: SUBSIDIARY_UPDATE_SCRIPT_ID,
            deploymentId: SUBSIDIARY_UPDATE_DEPLOYMENT_ID
        });
        var mrTaskId = mrTask.submit();
        log.debug("Map Reduce triggered: ", mrTaskId);

    }


    /*
    * Function to fetch open tickets from the Zendesk view
    */
    function fetchTicketsFromView(viewURL, autho){

        
        var response = https.request({
            method: https.Method.GET,
            url: viewURL,
            headers: autho
        });

        //log.debug("response: ", response);
        var content = response.body;
        log.debug("Response content: ", content);
        var viewObj = JSON.parse(content);

        var ticketsArr = [];
        for(var i = 0; i < viewObj['tickets'].length; i++){
            if(viewObj['tickets'][i].id){
                ticketsArr.push(viewObj['tickets'][i].id);
            }
        }
        log.debug('Tickets arr: ', ticketsArr);
        return ticketsArr;
    }


    /*
    * Function to fetch attchments from a particular ticket
    */
    function fetchTicketAttachments(ticketCommentURL, autho, ticketId){
        var attachment = '';
        
        var finalticketCommentURL = ticketCommentURL.replace('{TICKET_ID}', ticketId);
        log.debug('Tickets comment URL: ', finalticketCommentURL);
        var response = https.request({
            method: https.Method.GET,
            url: finalticketCommentURL,
            headers: autho
        });

        var content = response.body;
        var ticketCommentObj = JSON.parse(content);
        var commentsCount = ticketCommentObj['comments'].length;
        log.debug("Comments count: ", commentsCount);
        var found = 0;

        //looping through the coments, starting from the latest comment
        for(var i = commentsCount - 1; i >= 0; i--){
            var commentAttachmentCount = ticketCommentObj['comments'][i].attachments.length;

            //looping through the attachments in each comment
            for(var j = 0; j < commentAttachmentCount; j++){

                //checking for a valid .csv file
                if(ticketCommentObj['comments'][i].attachments[j].content_url.indexOf('.csv') > 0){
                    attachment = ticketCommentObj['comments'][i].attachments[j].content_url;
                    found = 1;
                    break;
                }
            }
            if(found === 1){
                log.debug('Inside found');
                break;
            }
        }

        
        if(attachment == ''){
            attachment = 'No Valid Attachment found'
        }
        
        log.debug('Attachment in function: ', attachment);
    
        return attachment;
    }


    /*
    * Function to convert a CSV data to an array, with white space and special characters handling
    */
    function CSVtoArray(text) {
        var re_valid =  /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/;
        var re_value =  /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;
       //if (!re_valid.test(text)) return null;
       var a = [];                    
       text.replace(re_value,
           function(m0, m1, m2, m3) {
               if      (m1 !== undefined) a.push(m1.replace(/\\'/g, "'"));
               else if (m2 !== undefined) a.push(m2.replace(/\\"/g, '"'));
               else if (m3 !== undefined) a.push(m3);
               return ''; 
           });
       if (/,\s*$/.test(text)) a.push('');
       return a;
    };


    /*
    * Function to authenticate Zendesk login
    */
    function GetAuthenticationHeaders(){

        var autho = [];
        var searchObj = search.create({
            type: "customrecord_ay_credentials",
            filters:
            [
               ["name","is","Zendesk"], 
               "AND", 
               ["isinactive","is","F"]
            ],
            columns:
            [
               search.createColumn({
                  name: "name",
                  sort: search.Sort.ASC,
                  label: "Name"
               }),
               search.createColumn({name: "custrecord_username", label: "Username"}),
               search.createColumn({name: "custrecord_encrypted_pass", label: "Password"}),
               search.createColumn({name: "custrecord_initial_code", label: "Initial Code"}),
               search.createColumn({name: "custrecord_encoded_key", label: "Secret Key"})
            ]
        });
        var searchResultCount = searchObj.runPaged().count;
        //log.debug("searchObj result count",searchResultCount);
        var username = '';
        var password = '';
        var initialCode = '';
        var key = '';
        if(searchResultCount > 0){
            var searchResult = searchObj.run().getRange({
                start: 0,
                end: 1
            });
            username = searchResult[0].getValue({
                name: 'custrecord_username'
            });
            password = searchResult[0].getValue({
                name: 'custrecord_encrypted_pass'
            });
            initialCode = searchResult[0].getValue({
                name: 'custrecord_initial_code'
            });
            key = searchResult[0].getValue({
                name: 'custrecord_encoded_key'
            });
            log.debug('Key in search: ', key);
        }
        
        // Re-Create the Secret key
        var sKey = crypto.createSecretKey({
            guid: key,
            encoding: encode.Encoding.UTF_8
        });
        log.debug('GUID of new key: ', sKey.guid);

        // Decrypt
        var decipher = crypto.createDecipher({
            algorithm: crypto.EncryptionAlg.AES,
            key: sKey,
            iv: initialCode
        });

        decipher.update({
            input: password,
            inputEncoding: encode.Encoding.HEX
        });

        var decipherout = decipher.final({
            outputEncoding: encode.Encoding.UTF_8
        });
        var decodedPassword = decipherout.toString();
        //log.debug('Final Password: ', decipherout.toString());

        if(username && password && initialCode && key){
            var headerValue = username + ':' + decodedPassword;
            var base64EncryptedStr = encode.convert({
                string: headerValue,
                inputEncoding: encode.Encoding.UTF_8,
                outputEncoding: encode.Encoding.BASE_64
            });
            autho['Authorization'] = 'Basic '+ base64EncryptedStr;
            autho['Content-Type'] = 'application/json';
        }
        else{
            log.error('Zendesk Login Credentials not configured');
        }
        return autho;
    }


    /*
    * Function to compare 2 address strings
    */
    function CompareAddress(addr1, addr2){

        //dictionary of word abbreviations
        var dict = {
            "rd": "road", 
            "ave": "avenue", 
            "avn": "avenue",
            "av": "avenue",
            "st": "street", 
            "str": "street",
            "sq": "square",
            "sqr": "square",
            "bld": "building",
            "bldg": "building",
            "pkwy": "parkway",
            "prkwy": "parkway",
            "drv": "drive",
            "dr": "drive",
            "blvd": "boulevard",
            "stn": "station",
            "apt": "apartment",
            "ste": "suite",
            "hwy": "highway",
            "rt": "route"
        };

        //processing the address and sorting the words in the address lexicographically
        var str1Mod = (addr1.replace(/[^a-zA-Z0-9 ]/g, "")).toLowerCase();
        var str2Mod = (addr2.replace(/[^a-zA-Z0-9 ]/g, "")).toLowerCase();
        var str1ModSorted = (str1Mod.split(" ")).sort();
        var str2ModSorted = (str2Mod.split(" ")).sort();

        //looping through the dictinary words and checking if they appear in the address
        for(var key in dict){
            
            var indices1 = GetAllIndexes(str1ModSorted, key);
            if(indices1.length > 0){

                //replacing the word in the address with the word from the dictionary
                for(var i = 0; i < indices1.length; i++){
                    str1ModSorted[indices1[i]] = dict[key];
                }
            }
        
            var indices2 = GetAllIndexes(str2ModSorted, key);
            if(indices2.length > 0){

                //replacing the word in the address with the word from the dictionary
                for(var i = 0; i < indices2.length; i++){
                    str2ModSorted[indices2[i]] = dict[key];
                }
            }
        }

        log.debug("1st address sorted: ", str1ModSorted);
        log.debug("2nd address sorted: ", str2ModSorted);

        //comparing
        if(str1ModSorted.join(' ') === str2ModSorted.join(' ')){
            log.debug("Match");
            return true;
        }
        else{
            log.debug("Not matched");
            return false;
        }
    }


    /*
    * Function to get all the indices of a word in a string
    */
    function GetAllIndexes(arr, val) {
        var indexes = [], i;
        for(i = 0; i < arr.length; i++)
            if (arr[i] === val){
                indexes.push(i);
            }
        return indexes;
    }
  

    // Link each entry point to the appropriate function.
    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
}); 
