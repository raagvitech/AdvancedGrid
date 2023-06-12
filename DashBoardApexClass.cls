public with sharing class DashBoardApexClass {
   nabled (cacheable=true)
    public static List<AggregateResult> getQuarterwisedata(){
        return[SELECT ProductCat__c	, CALENDAR_QUARTER(DateProduct__c)Quarter__c, SUM(PriceOfTheProducet__c)PriceOfTheProducet  FROM ProductDetails__c GROUP BY  ProductCat__c,  CALENDAR_QUARTER(DateProduct__c)
        ];
    }
    @AuraEnabled (cacheable=true)
    public static List<AggregateResult> getMonthwisedata(Integer quarter){
        return[SELECT ProductCat__c	,CALENDAR_MONTH(DateProduct__c)month, SUM(PriceOfTheProducet__c)PriceOfTheProducet  FROM ProductDetails__c    
          WHERE CALENDAR_QUARTER(DateProduct__c) = :quarter
        GROUP BY ProductCat__c, CALENDAR_MONTH(DateProduct__c)
        ];
    } 
    
}
