Client = {
    signedURL: '',
    contentType: '',
    getSignedURLAjax: '',
    saveRecordURLAjax: '',
    recordId: '',
    eventId: '',
    instanceId: '',
    downloadLinks: [],
    form: [],
    fields: [],
    filesPath: {},
    isSurvey: false,
    isLinkDisabled: false,
    isAutoSaveDisabled: false,
    isDirty: false,
    tempDataEntrySubmit: null,
    smartVariableRegex: '^\\[.*\\]$',
    init: function () {

        Client.tempDataEntrySubmit = dataEntrySubmit;


        // override form/survey submit function while upload is in progress.
        window.dataEntrySubmit = function (e) {

            if (Client.isDirty) {
                Client.submitWarningDialog();
                $("button[name='submit-btn-saverecord']").removeAttr('disabled').removeClass('ui-button-disabled').removeClass('ui-state-disabled');
                return false;
            } else {
                Client.tempDataEntrySubmit.apply(this, arguments);
            }
            // do what you need to do in the event listener here

        }
        // test builder
        Client.removeAutoParam()
        // with ajax disable all submit buttons till ajax is completed
        jQuery(document).on({
            ajaxStop: function () {
                $(".btn-primaryrc").removeAttr('disabled')
            },
            ajaxStart: function () {
                $(".btn-primaryrc").attr('disabled', 'disabled')
            }
        });

        Client.processFields();
        $(".google-storage-field").on('change', function () {
            var files = $(this).prop("files")
            var field = $(this).data('field')
            var prefix = $(this).data('prefix')
            var bucket = $(this).data('bucket')
            Client.form = $(this).parents('form:first');

            if ($(this).data('prefix-has-smart-variables') === true) {
                prefix = Client.prepareUploadPrefix(prefix);
                if (prefix === false) {
                    $(this).val('')
                    return false;
                }
            }

            for (var i = 0; i < files.length; i++) {
                Client.getSignedURL(files[i].type, files[i].name, field, files[i], bucket, prefix)
            }

            //Client.getSignedURL(file[0].type, file[0].name, field)
        });


        $(document).on('click', '.get-download-link', function () {
            var fieldName = $(this).data('field-name')
            var fileName = $(this).data('file-name')
            var id = $(this).data('file-id')
            Client.getDownloadSignedURL(fieldName, fileName, id)
        })
    },
    prepareUploadPrefix: function (prefix) {
        var parts = prefix.split("/");
        var result = ''
        for (var i = 0; i < parts.length; i++) {
            var p = parts[i];
            if (p.search(Client.smartVariableRegex) > -1) {
                var v = Client.getSmartVariableValue(p)
                if (v == '' || v == undefined) {
                    Client.showWarningDialog(p + ' field is required to upload files');
                    return false;
                }
                Client.lockField(p)
                result += v + "/";
            }
        }

        r = result.slice(0, -1)
        return r
    },
    getSmartVariableValue: function (variable) {
        var r = Client.removeSquareBrackets(variable)
        var v = jQuery("select[name=" + r + "] :selected").val();
        return v;
    },
    removeSquareBrackets: function (variable) {
        var result = variable.slice(1, -1)
        return result
    },
    // we want to remove this param so after on save record in saves to correct record id.
    removeAutoParam: function () {
        let url = new URL(window.location.href);
        var temp = url
        temp = temp.toString().replace('&auto=1', '');
        window.history.pushState({path: temp}, '', temp);

    },
    saveRecord: function (path, field) {
        $.ajax({
            // Your server script to process the upload
            url: Client.saveRecordURLAjax,
            type: 'POST',

            // Form data
            data: {
                'record_id': Client.recordId,
                'event_id': Client.eventId,
                'instance_id': Client.instanceId,
                'files_path': JSON.stringify(Client.filesPath),
                'current_path': path,
                'current_field': field !== undefined ? field : ''
            },
            success: function (data) {
                var response = JSON.parse(data)
                if (response.status === 'success') {
                    Client.downloadLinks = response.links
                    Client.processFields(path);

                    // change few parameter to let redcap save existing record
                    record_exists = 1;
                    $('input[name ="hidden_edit_flag"]').val(1);
                    Client.isDirty = false
                }
            },
            complete: function () {
                $(".btn-primaryrc").removeAttr('disabled')
            },
            error: function (request, error) {
                Client.showWarningDialog("Request: " + JSON.stringify(request));
            }
        });
    },
    processFields: function (path) {
        for (var prop in Client.fields) {
            $elem = jQuery("input[name=" + prop + "]").attr('type', 'hidden');
            var files = Client.downloadLinks[prop];

            if ($elem.val() !== '' || (files != undefined)) {

                if (path === undefined) {
                    var $links = $('<div id="' + prop + '-links"></div>')
                    for (var file in files) {
                        // if download links are disable
                        // if (files[file] != '') {
                        //     $links.append('<div id="' + Client.convertPathToASCII(file) + '"><a class="google-storage-link" target="_blank" href="' + files[file] + '">' + file + '</a><br></div>')
                        // } else {
                        //     $links.append('<div id="' + Client.convertPathToASCII(file) + '"><div class="file-name" data-file-id="' + Client.convertPathToASCII(file) + '">' + file + '</div> <a  data-field-name="' + prop + '" data-file-id="' + Client.convertPathToASCII(file) + '" data-file-name="' + file + '" class="get-download-link btn btn-primary btn-sm" href="#">Get Download Link</a><br></div>')
                        // }
                        if (Client.isLinkDisabled || Client.isSurvey === "1") {
                            $links.append('<div id="' + Client.convertPathToASCII(file) + '"><div class="file-name" data-file-id="' + Client.convertPathToASCII(file) + '">' + file + '</div></div>')
                        } else {
                            $links.append('<div id="' + Client.convertPathToASCII(file) + '"><div class="file-name" data-file-id="' + Client.convertPathToASCII(file) + '">' + file + '</div> <a  data-field-name="' + prop + '" data-file-id="' + Client.convertPathToASCII(file) + '" data-file-name="' + file + '" class="get-download-link btn btn-primary btn-sm" href="#">Get Download Link</a><br></div>')
                        }

                    }
                    $links.insertAfter($elem);
                    // if path is defined this mean the function was called after upload is complete. then we need to replace only the progress bar that completed.
                } else {
                    // if download links are disable
                    if ((files !== undefined && files[path] != '')) {
                        $("#" + Client.convertPathToASCII(path)).html('<a class="google-storage-link" target="_blank" href="' + files[path] + '">' + path + '</a><br>')
                    } else {
                        if (Client.isLinkDisabled || Client.isSurvey === "1") {
                            $("#" + Client.convertPathToASCII(path)).html('<div class="file-name" data-file-id="' + Client.convertPathToASCII(path) + '">' + path + '</div><br>')
                        } else {
                            $("#" + Client.convertPathToASCII(path)).html('<div class="file-name" data-file-id="' + Client.convertPathToASCII(path) + '">' + path + '</div><a  data-field-name="' + prop + '" data-file-id="' + Client.convertPathToASCII(path) + '" data-file-name="' + path + '" class="get-download-link btn btn-primary btn-sm" href="#">Get Download Link</a><br>')
                        }
                    }
                }
            }
            // only add form in the first time.
            if (path === undefined) {

                $('<form class="google-storage-form" enctype="multipart/form-data"><input multiple class="google-storage-field" data-field="' + prop + '" data-bucket="' + Client.getBucketName(Client.fields[prop]) + '" data-prefix="' + Client.getFieldPrefix(Client.fields[prop]) + '"  data-prefix-has-smart-variables="' + Client.fieldHasSmartVariables(Client.fields[prop]) + '" type="file"/></form>').insertAfter($elem)
            }

            if (path !== undefined) {
                Client.uploadDialog(path)
            }
        }
    },
    getBucketName: function (field) {
        if (typeof field !== 'string') {
            Client.showWarningDialog('EM is miss configured. Please check with Project with Admin');
            return false;
        }
        var parts = field.split('/');
        return parts[0];
    },
    getFieldPrefix: function (field) {
        if (typeof field !== 'string') {
            Client.showWarningDialog('EM is miss configured. Please check with Project with Admin');
            return false;
        }
        var parts = field.split('/');
        // remove first element which represent the bucket name
        parts.shift();
        return parts.join('/')
    },
    fieldHasSmartVariables(field) {

        if (typeof field !== 'string') {
            Client.showWarningDialog('EM is miss configured. Please check with Project with Admin');
            return false;
        }
        var parts = field.split('/');
        // remove first element which represent the bucket name
        parts.shift();
        var hasSmartVar = false;
        for (var i = 0; i < parts.length; i++) {
            var p = parts[i];

            if (p.search(Client.smartVariableRegex) > -1) {
                var v = Client.getSmartVariableValue(p);
                // when record is saved and smart variable has value then lock it so it cant be changed.
                if (v != '') {
                    Client.lockField(p)
                }
                hasSmartVar = true
            }
        }

        return hasSmartVar;
    },
    lockField: function (variable) {
        var r = Client.removeSquareBrackets(variable)
        $("select[name=" + r + "]").attr('disabled', 'disabled');
    },
    uploadDialog: function (path) {
        Client.showWarningDialog('File <strong>' + path + '</strong> Uploaded successfully');
    },
    submitWarningDialog: function () {
        Client.showWarningDialog('You cant submit while upload in progress. You can cancel upload or wait till completes. ');
    },
    showWarningDialog: function (text) {
        $("#upload-dialog").html(text);
        $('#upload-dialog').dialog({
            bgiframe: true, modal: true, width: 400, position: ['center', 20],
            open: function () {
                fitDialog(this);
            },
            buttons: {
                Close: function () {
                    $(this).dialog('close');
                }
            }
        });
    },
    getDownloadSignedURL: function (field_name, file_name, id) {
        $.ajax({
            // Your server script to process the upload
            url: Client.getSignedURLAjax,
            type: 'GET',

            // Form data
            data: {
                'file_name': file_name,
                'field_name': field_name,
                'action': 'download'
            },
            success: function (data) {
                var response = JSON.parse(data)
                if (response.status === 'success') {
                    $("#" + id).html('<a target="_blank" href="' + response.link + '">' + file_name + '</a>')
                }
            },
            error: function (request, error) {
                alert("Request: " + JSON.stringify(request));
            }
        });
    },
    getSignedURL: function (type, name, field, file, bucket, prefix) {
        $.ajax({
            // Your server script to process the upload
            url: Client.getSignedURLAjax,
            type: 'GET',

            // Form data
            data: {
                'content_type': type,
                'file_name': name,
                'field_name': field,
                'record_id': Client.recordId,
                'event_id': Client.eventId,
                'instance_id': Client.instanceId,
                'bucket': bucket,
                'file_prefix': prefix,
                'action': 'upload'
            },
            success: function (data) {
                var response = JSON.parse(data)
                if (response.status === 'success') {
                    Client.isDirty = true
                    Client.uploadFile(response.url, type, file, response.path, field)
                }
            },
            error: function (request, error) {
                alert("Request: " + JSON.stringify(request));
            }
        });
    },
    convertPathToASCII: function (path) {
        return path
            .split('')
            .map(x => x.charCodeAt(0))
            .reduce((a, b) => a + b);
    },
    uploadFile: function (url, type, file, path, field) {

        $.ajax({
            // Your server script to process the upload
            url: url,
            type: 'PUT',

            // Form data
            data: file,

            // Tell jQuery not to process data or worry about content-type
            // You *must* include these options!
            processData: false,
            contentType: false,
            cache: false,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": type,
            },

            beforeSend: function () {
                if ($('#' + Client.convertPathToASCII(path)).length) {
                    $('#' + Client.convertPathToASCII(path)).html('<progress data-name="' + file.name + '"></progress>' + file.name + '<span data-name="' + file.name + '"> <i class="fas fa-window-close"></i></span><br></div>')
                } else {
                    $('<div id="' + Client.convertPathToASCII(path) + '"><progress data-name="' + file.name + '"></progress>' + file.name + '<span data-name="' + file.name + '"> <i class="fas fa-window-close"></i></span><br></div>').insertAfter(Client.form);
                }
            },
            complete: function (xhr, status) {
                if (status == 'success') {
                    if (Client.filesPath[field] === undefined || Client.filesPath[field] === '') {
                        Client.filesPath = {
                            [field]: path
                        }
                    } else {
                        // only attach if file is new file
                        if (Client.filesPath[field].indexOf(path) !== false) {
                            Client.filesPath[field] += ',' + path
                        }
                    }
                    // make sure to set the value in case user clicked default save button .
                    jQuery("input[name=" + field + "]").val(Client.filesPath[field]);

                    // do not save for surveys
                    if (Client.isAutoSaveDisabled == false) {
                        Client.saveRecord(path, field);
                    } else {
                        Client.processFields(path);
                    }

                }

            },
            // Custom XMLHttpRequest
            xhr: function () {
                var myXhr = $.ajaxSettings.xhr();
                if (myXhr.upload) {
                    // For handling the progress of the upload
                    myXhr.upload.addEventListener('progress', function (e) {
                        if (e.lengthComputable) {
                            $('progress[data-name="' + file.name + '"]').attr({
                                value: e.loaded,
                                max: e.total,
                            });
                        }
                    }, false);

                    myXhr.upload.addEventListener('abort', function (e) {
                        console.log(e)
                    }, false);
                }

                var _cancel = $('span[data-name="' + file.name + '"]');

                _cancel.on('click', function () {
                    if (confirm('Are you sure you want to cancel upload for ' + file.name + '?')) {
                        myXhr.abort();
                        $('#' + Client.convertPathToASCII(path)).html('')
                    }
                })

                return myXhr;
            }
        });
    }
}