public with sharing class customContactTable {
  @AuraEnabled
  public static List<Contact> getContacts(string sourceAccount){
    List<Contact> conList = [SELECT Id,Name,Account.Name,LastName,FirstName,Email,Phone,Level__c	 From Contact where AccountId =: sourceAccount];
    return conList;
  }
  @AuraEnabled
  public static List<Contact> EditedCon(List<Contact> contList){
    List<Contact> contactFields = contList;
    upsert contactFields;
    return contactFields;
  }
}