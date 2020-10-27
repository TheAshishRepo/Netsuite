/**

 *@NApiVersion 2.0
 *@NScriptType Suitelet     

 */
// testing for deployment
define(["N/ui/serverWidget", "N/crypto", "N/runtime", "N/encode", "N/search", "N/record"],
    function (ui, crypto, runtime, encode, search, record){
        function onRequest(context){
            if (context.request.method == 'GET'){
                var form = ui.createForm({
                    title: 'Zendesk Login Credentials Setup for Bill To Automation'
                });

                form.addField({
                    id: 'custpage_username',
                    label: 'Enter your Zendesk Username',
                    type: 'text'
                });

                form.addField({
                    id: 'custpage_password',
                    label: 'Enter your Zendesk Password',
                    type: 'text'
                });

                form.addSecretKeyField({
                    id: 'guidkey',
                    label: 'Enter 16, 24 or 32 byte length String (any string)',
                    restrictToScriptIds: [runtime.getCurrentScript().id, 'customscript_ay_mr_fetch_zd_data2',  'customscript_ay_mr_fetch_zd_data'],
                    restrictToCurrentUser: false
                }).maxLength = 200;

                form.addSubmitButton();
                context.response.writePage(form);
            } else{
                var form = ui.createForm({
                    title: 'Zendesk Login Credentials Setup for Bill To Automation'
                });
                var guid = context.request.parameters.guidkey;
                var inputString = context.request.parameters.custpage_password;
                var username = context.request.parameters.custpage_username;

                // Create the key
                var sKey = crypto.createSecretKey({
                    guid: guid,
                    encoding: encode.Encoding.UTF_8
                });

                log.debug('guid', guid);
                log.debug('inputString', inputString);

                // Encrypt
                var cipher = crypto.createCipher({
                    algorithm: crypto.EncryptionAlg.AES,
                    key: sKey
                });

                cipher.update({
                    input: inputString
                });

                var cipherout = cipher.final({
                    outputEncoding: encode.Encoding.HEX
                });

                log.debug('cipherout.iv', cipherout.iv);
                log.debug('cipherout.ciphertext', cipherout.ciphertext);

                var encodedKey = encode.convert({
                    string: sKey,
                    inputEncoding: encode.Encoding.UTF_8,
                    outputEncoding: encode.Encoding.HEX
                });

                var encodedIV = encode.convert({
                    string: cipherout.iv,
                    inputEncoding: encode.Encoding.UTF_8,
                    outputEncoding: encode.Encoding.HEX
                });

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
                       search.createColumn({name: "internalid", label: "Internal ID"})
                    ]
                });
                var searchResultCount = searchObj.runPaged().count;
                log.debug('Search count: ', searchResultCount);
                var searchResult = searchObj.run().getRange({
                    start: 0,
                    end: 1
                });
                var recId = searchResult[0].getValue({
                    name: 'internalid'
                });
                log.debug('Config record internal ID: ', recId);
                var rec = record.load({
                    type: 'customrecord_ay_credentials', 
                    id: recId
                });
                rec.setValue('custrecord_username', username);
                rec.setValue('custrecord_encrypted_pass', cipherout.ciphertext);
                log.debug('Skey GUID: ', sKey.guid);
                log.debug('Skey Encoding: ', sKey.encoding);
                rec.setValue('custrecord_encoded_key', sKey.guid);
                rec.setValue('custrecord_initial_code', cipherout.iv); 
                rec.save();

                // Decrypt
                var decipher = crypto.createDecipher({
                    algorithm: crypto.EncryptionAlg.AES,
                    key: sKey,
                    iv: cipherout.iv
                });

                decipher.update({
                    input: cipherout.ciphertext,
                    inputEncoding: encode.Encoding.HEX
                });

                var decipherout = decipher.final({
                    outputEncoding: encode.Encoding.UTF_8
                });

                // Display
                form.addField({
                    id: 'custpage_outputtext',
                    label: 'Decrypted text is',
                    type: 'text'
                }).defaultValue = decipherout.toString();

                form.addField({
                    id: 'custpage_outputusername',
                    label: 'Username is',
                    type: 'text'
                }).defaultValue = username;
                context.response.writePage(form);
            }
        }
        return {
            onRequest: onRequest
        };
    });
