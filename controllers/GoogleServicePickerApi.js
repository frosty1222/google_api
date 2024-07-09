const { google } = require('googleapis');
const BaseAuth = require('./BaseAuth');
class GoogleServicePickerApi{
    constructor() {
        this.baseAuth = new BaseAuth();
        this.handleUpload =  this.handleUpload.bind(this)
    }

    openPicker=async()=> {
        const picker = new google.picker.PickerBuilder()
            .addView(google.picker.ViewId.DOCS)
            .setOAuthToken(this.oAuth2Client.credentials.access_token)
            .setDeveloperKey('YOUR_DEVELOPER_KEY_HERE')
            .setCallback(this.pickerCallback.bind(this))
            .build();
        picker.setVisible(true);
    }

    pickerCallback(data) {
        if (data.action === google.picker.Action.PICKED) {
            const selectedFiles = data.docs;
            console.log('Selected files:', selectedFiles);
        }
    }

    handleUpload=(req, res)=>{
        const selectedFiles = req.body.files;
        console.log('Received files:', selectedFiles);
        res.send('Files received');
    }
}
model.exports = new GoogleServicePickerApi();