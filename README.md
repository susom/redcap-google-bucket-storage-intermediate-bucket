# Google Storage with Intermediate bucket

This EM is spin off from original GoogleStorage EM which will upload files directly from REDCap user client directly to
Google bucket. Some Google Projects have restricted security requirements that would force user to be on VPN to be able
to upload files to a bucket inside these projects. To resolve this issue this EM will upload user`s files into
intermediate open bucket then REDCap server will move these files into the more restricted bucket.

#### Google Storage configuration:

1. Ask REDCap administrator for the email address of universal SA account that has access to the intermediate bucket.
2. In your project give the universal SA email `Storage Admin` in your bucket. Go into your bucket then under Permission
   tab add the email with appropriate permissions.
3. Using `gutil` set below CORS settings for your bucket. https://cloud.google.com/storage/docs/configuring-cors#gsutil

`[
{
"origin": [
"[YOUR_DOMAIN]"
],
"responseHeader": [
"Content-Type",
"X-Requested-With",
"Access-Control-Allow-Origin",
"x-goog-resumable"
],
"method": [
"GET",
"HEAD",
"DELETE",
"POST",
"PUT",
"OPTIONS"
],
"maxAgeSeconds": 3600 }
]`

#### REDCap EM configuration:

1. Click on External Modules in left Main Menu. then click configure for `GoogleStorageIntermediateBucket - v9.9.9`
2. Define the list of buckets name that you want to access via this EM.

![Alt text](assets/images/redcap-em-config.png?raw=true&123 "REDCap EM Config" )

#### REDCap Form Configuration:

1. Create new text form field.
2. In Action Tags/Field Annotation box add following `@GOOGLE-STORAGE=[YOUR_BUCKET_NAME]`
3. Optional: You can override files prefix defined in EM settings. There are two ways to override the prefix. First you
   can add actual folder name `@GOOGLE-STORAGE=[YOUR_BUCKET_NAME]/[FOLDER_NAME]`. Second you can use REDCap smart
   variables to customize the prefix based on user selections from
   dropdowns `@GOOGLE-STORAGE=[YOUR_BUCKET_NAME]/[REDCAP_FIELD_NAME_1]/[REDCAP_FIELD_NAME_2]`.

**Note: if you using smart variables these variables MUST be dropdowns for user to pick from. EM does not support text
input fields. Also make sure the prefix is defined as the option value not the label `stude_1, Study 1`**
![Alt text](assets/images/redcap-field-config.png?raw=true "REDCap Field Config")
