import { LightningElement, wire, api, track } from 'lwc';
import getContacts from '@salesforce/apex/customContactTable.getContacts';
import EditedCon from '@salesforce/apex/customContactTable.EditedCon';
import { getPicklistValues,getObjectInfo } from 'lightning/uiObjectInfoApi';
import Level__c from '@salesforce/schema/Contact.Level__c';
import contact from '@salesforce/schema/Contact';
import { deleteRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import LightningConfirm from 'lightning/confirm';
export default class ContactsInlineEdit extends LightningElement {
    @api recordId;
    @track contactList = [];
    renderTable = false;
    @track objectApiName
    @track isEdit = false;
    @track contactfn = [];
    allClients; //storing all clients data. Not to be modified
    allFilteredClients; //storing all filtered clients data. can be modified
    paginatedClientData; //storing array of client data based on limit chunks
    pageLimit = '10'; //number of record to display per page
    pages = [{ label: '1', value: '1' }]; //pagination data (total pages)
    selectedPage = '1'; //current selected page
    totalPages; //store total number of pages
    isFisrt = true;
    isLast = false;
    totalRecords;
    pageParam;
    value = '';
    recordOptions =[];
    picklistvalues;
    //get options for the limit dropdown
    get pageLimitOptions() {
        return [
            { label: 'ContactsPerPage: 10', value: '10' },
            { label: 'ContactsPerPage: 25', value: '25' },
            { label: 'ContactsPerPage: 50', value: '50' },
            { label: 'ContactsPerPage: 100', value: '100' },
        ];
    }
    @wire (getObjectInfo, {objectApiName: contact})
    objectInfo;
    @wire( getPicklistValues, { recordTypeId: '$objectInfo.data.defaultRecordTypeId', fieldApiName: Level__c } )
    wiredData( { error, data } ) {
        console.log( 'Inside Get Picklist Values' );
        if ( data ) {
            console.log( 'Data received from Picklist Field ' + JSON.stringify( data.values ) );
            this.recordOptions = data.values.map( objPL => {
                return {
                    label: `${objPL.label}`,
                    value: `${objPL.value}`
                };
            });
            console.log( 'Options are ' + JSON.stringify( this.recordOptions ) );
        } else if ( error ) {
            console.error('ERROR getPicklistValues: ', JSON.stringify( error ) );
        }
    }
    getContacts() {
        getContacts({ sourceAccount: this.recordId })
            .then(result => {
                this.renderTable = true;
                console.log('this.contactList', JSON.stringify(result));
                this.totalRecords = result.length;
                console.log('this.totalRecords', this.totalRecords);
                result.forEach(ele => {
                    this.contactList.push({
                        Id: ele.Id,
                        FirstName: ele.FirstName,
                        LastName: ele.LastName,
                        Email: ele.Email,
                        Phone: ele.Phone,
                        Level__c: ele.Level__c	,
                        isEdit: false,
                    });
                     console.log('ele.FirstName', ele.FirstName);
                    console.log('ele.LastName', ele.LastName);
                    console.log('ele.Email', ele.Email);
                    console.log('ele.Phone', ele.Phone);
                    console.log('ele.Level__c', ele.Level__c); 
                    this.totalRecords = result.length;
                    this.allClients = result;
                    this.allFilteredClients = result;
                    this.isLast = false;
                    this.isFirst = true;
                    this.handlePagination(); //invoking the pagination logic
                    this.validatePagination();
                });
                console.log('contactList: ', (JSON.stringify(this.contactList)));
            }).catch(error => {
                console.log('ERROR_1: ', error);
            })
    }
    connectedCallback() {
        console.log('the recif', this.recordId);
        this.getContacts();
    }
    // <<<< Js Code For Deleting The Record Permanently In the Ui Page >>>>>>
     deleteContact(event) {
        this.deletedcontact( event.currentTarget.dataset.recid);
    }
   async deletedcontact(userid){
    const result =  await LightningConfirm.open({
        label: 'Are you want to delete the Record?.',
        message: 'Conformation Message For Delete The Record.',
        theme: 'alt-inverse',
    });
    if(result){
        deleteRecord(userid)
                .then(() => {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Record Is Deleted',
                            variant: 'success',
                        }),
                    );
                    console.log('result');
                    let contacts = this.contactList;
                    contacts = contacts.filter(con => con.Id != userid);
                    this.contactList = [...contacts];
                })
                .catch(error => {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error',
                            message: error.message,
                            variant: 'error',
                        }),
                    );
                    console.log('error message');
                });
    }
   }
    //  <<< Code for edit perticular Contact by useing find method to select the perticular id in table >>>>>
    // the field = false for to show the Save button after clicking edit icon >>>>
    @track field = false;
    // <<<  the cfield = false same as save but this is for cancel button >>>>>
    @track cfield = false;
    @track editfield=false;
    editContact(event) {
        //<<<<  Find method to select perticular id in contact table >>>>>>
        var rowId = event.currentTarget.dataset.recid;
        console.log('rowId: ', rowId);
        console.log('obj1 ', JSON.stringify(this.contactList));
        let data = this.contactList;
        console.log('data11111 ', JSON.stringify(this.contactList));
        try {
            data = data.map(d => {
                console.log('data>>>>>>> ', JSON.stringify(d));
                var target1 = {};
                let obj = Object.assign(target1, d);
                console.log('obj1????????', JSON.stringify(obj));
                if (d.Id === rowId) {
                    console.log('obj2 ', JSON.stringify(obj));
                    obj['isEdit'] = true;
                }
                return obj;
            });
            console.log('data', data);
            this.contactList = data;
            console.log('obj3 ', JSON.stringify(this.contactList));
        } catch (error) {
            console.log('EDIT ERROR: ', error);
        }
        this.isEdit = true;
        if (this.isEdit == true) {
            this.field = true;
            console.log('this.field', this.field);
            this.cfield = true;
            console.log('this.cfield ', this.cfield);

        }
        else {
            this.field = false;
            this.cfield = false;
        }
        console.log('*********', this.field);
        console.log('&&&&&&&&&&&', JSON.stringify(contact));
    }
    //<<<<<<<< this is onchange event for table to change the values in the table >>>>>>>>
    update(event) {
        //<<<<<< here also we used find method to select perticular record and edit for that record
        var selectedId = event.currentTarget.dataset.recid;
        var contactfn = this.contactList.find(ele => ele.Id === selectedId);
        //This is for to store the values given by you >>>
        console.log('val: ', event.target.value);
        if (event.target.label === "FirstName") {
            //this is FirstName input textbox
            contactfn.FirstName = event.target.value;
            console.log('FirstName--', JSON.stringify(contactfn));
        }
        else if (event.target.label === "LastName") {
            //this is LastName input textbox
            contactfn.LastName = event.target.value;
            // console.log('-------------&', JSON.stringify(contactfn));
        }
        else if (event.target.label === "Email") {
            //this is Email input textbox
            contactfn.Email = event.target.value;
            // console.log('-------------&', JSON.stringify(contactfn));
        }
        else if (event.target.label === "Phone") {
            //this is Phone input textbox
            contactfn.Phone = event.target.value;
            // console.log('-------------&', JSON.stringify(contactfn));
        }
        else if (event.target.name === "Level") {
            //this is Mobile input textbox
            this.picklistvalues = event.target.value;
            console.log('.66666666',   this.picklistvalues);
            contactfn.Level__c= event.target.value;
            console.log('-----------', JSON.stringify(contactfn));
        }
    }
    // <<<<  The save the records edited in the Ui page >>>>>>
    // <<<< here we imported the Editedcon metod from the apex class and contList array from apex class >>>>
    saverecord() {
        EditedCon({ contList: this.contactList })
            .then((result) => {
                console.log('res-> ',result);
                this.contactList = [...result];
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Record Is Successfully Edited And Saved',
                        variant: 'success',
                    }),
                );
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: error.message,
                        variant: 'error',
                    }),
                );
            });
            // this.isSave=false;
            this.field = false;
            this.cfield = false;
    }
    // <<<<< code for the  without reload page and without saving the data when click on the cancel button >>>>
    handleCancel() {
        this.contactList.forEach(element =>{
            element.isEdit=false;
        })
        getContacts({ sourceAccount: this.recordId })
        .then(result => {
            this.contactList = result;
        })
        .catch(error => {
            this.error = error;
        });
        this.field = false;
        this.cfield = false;
       }
        handleLimitChange(event) {
            this.pageLimit = event.detail.value;
            console.log('this.totalPages',  this.pageLimit);
            this.selectedPage = '1';
            this.isLast = false;
            this.isFirst = true;
            this.handlePagination(); //invoking the pagination logic
            this.validatePagination();
        }
        handlePagination() {
            this.pages = [];
            this.totalPages = Math.ceil(this.allFilteredClients.length / parseInt(this.pageLimit));
            console.log(this.totalPages);
            for (var i = 1; i <= this.totalPages; i++)
                this.pages.push({ label: 'Page: ' + i.toString(), value: i.toString() });
            var perChunk = parseInt(this.pageLimit) // items per chunk    
            var inputArray = this.allFilteredClients;
            var result = inputArray.reduce((resultArray, item, index) => {
                const chunkIndex = Math.floor(index / perChunk)
                if (!resultArray[chunkIndex]) {
                    resultArray[chunkIndex] = [] // start a new chunk
                }
                resultArray[chunkIndex].push(item)
                return resultArray
            }, [])
            this.paginatedClientData = result;
            this.contactList = this.paginatedClientData[parseInt(this.selectedPage) - 1];
        }
        handleNext() {
            if (!this.isLast)
                this.selectedPage = (parseInt(this.selectedPage) + 1).toString();
            this.contactList = this.paginatedClientData[parseInt(this.selectedPage) - 1];
            this.validatePagination();
        }
        handlePrev() {
            if (!this.isFirst)
                this.selectedPage = (parseInt(this.selectedPage) - 1).toString();
            this.contactList = this.paginatedClientData[parseInt(this.selectedPage) - 1];
            this.validatePagination();
        }
        handlePageChange(event) {
            this.selectedPage = event.detail.value;
            this.contactList = this.paginatedClientData[parseInt(this.selectedPage) - 1];
            this.validatePagination();
        }
        handleFirst() {
            this.selectedPage = '1';
            this.isFirst = true;
            this.isLast = false;
            this.contactList = this.paginatedClientData[parseInt(this.selectedPage) - 1];
            this.validatePagination();
        }
        handleLast() {
            this.selectedPage = this.totalPages.toString();
            this.isFirst = false;
            this.isLast = true;
            this.contactList = this.paginatedClientData[parseInt(this.selectedPage) - 1];
            this.validatePagination();

        }
        validatePagination() {
            if (parseInt(this.selectedPage) == 1) {
                this.isFirst = true;
                this.isLast = true;
            }
            else if (parseInt(this.selectedPage) == parseInt(this.totalPages)) {
                this.isFirst = false;
                this.isLast = true;
            }
        
            else {
                this.isFirst =false;
                this.isLast = false;
            }
            var end = (parseInt(this.selectedPage) * parseInt(this.pageLimit)) > this.totalRecords ? this.totalRecords : (parseInt(this.selectedPage) * parseInt(this.pageLimit));
            this.pageParam = (parseInt(this.selectedPage) * parseInt(this.pageLimit) - (parseInt(this.pageLimit) - 1)) + ' to ' + end;
        }
    }


