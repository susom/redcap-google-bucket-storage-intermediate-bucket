# Google Storage

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

![Alt text](assets/images/redcap-field-config.png?raw=true "REDCap Field Config")
