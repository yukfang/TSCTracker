const proxying = require('../http/proxying');
const cookieRemote = require('./cookie');

let cookie = {
    value : '',
    fetchTime : 0
}

const DATE_STEPS = [
   // {start_date : "2024-01-01", end_date : "2024-01-15"},
   {start_date : "2024-01-01", end_date : "2024-02-01"},
   {start_date : "2024-02-01", end_date : "2024-03-01"},
   {start_date : "2024-03-01", end_date : "2024-04-01"},

]

const METRICS = [

   "is_vip",
   "title",
   "urged",
   "is_guest",
   "board_name",
   "order_first_name",
   "order_second_name",
   "current_role_name",
   "employee_avatar",
   "employee_email",
   "show_auto_assign",
   "vip_type",
   "circulation_count",
   "circulation_reply",
   "pending_status",
   "time_before_overtime_seconds",
   "time_after_overtime_seconds",
   "is_overtime",
   "is_impending_overtime",
   "is_auto_closing",
   "total_reply_count",

   "order_id",
   "plat_id",
   "priority",
   "employee_id",
   "employee_name",

   "last_reply_time",
   "pending_time",
   "create_time",
   "update_time",
   "last_pending_time",


   "category_1_name",
   "archive_category",
   "archive_category_1"
]

async function athena_api_v2_swimlane(metrics = METRICS){
    const endpoint = `https://ads.tiktok.com/athena/api/v2/processor/statistics/swimlane/list/?name=swim-lane-5`;
    const method      = 'POST';

    if(Date.now() - cookie.fetchTime > 1000 * 60 * 3) {
        cookie = {
            value: (await cookieRemote()),
            fetchTime: Date.now()
        }
    }
    // console.log(`cookie = ${JSON.stringify(cookie)}`)
    let header      = {Cookie: cookie.value}
    let body        = {
            "dims":[
               "order_id"
            ],
            "metrics":metrics,
            "filters":[
               {
                  "field": "plat_id", "filter_type":0, "in_field_values":[ "1736490999244882"]
               },
               {
                  "field":"athena_order_bool_expression",
                  "filter_type":1000,
                  "expression":{
                    "AND":[
                     //   {
                     //      "field":"archive_category",
                     //      "filter_type":0,
                     //      "in_field_values":[
                     //         "1705151646989719_1768849764192273"
                     //      ]
                     //   }
                     {
                        "field":"create_time",
                        "filter_type":1,
                        "range_lower":"2024-01-01T00:00:00",
                        "range_upper":"2025-01-01T00:00:00"
                     },
                    ]
                 }
               }
            ],
            "extra":{
               "service_type":7
            },
            "order_field":"last_pending_time",
            // "order_field":"order_id",
            "order_type":1,
            "page":1,
            "page_size": 1000
    };
   let param   = null;

   let records = []
   for(let i = 0; i < DATE_STEPS.length; i++) {
      let body_x = Object.assign({},body)
      body_x.filters.push(
         {
            "field":"athena_order_bool_expression",
            "filter_type":1000,
            "expression":{
              "AND":[
                  {
                     "field":"create_time",
                     "filter_type":1,
                     "range_lower": `${DATE_STEPS[i].start_date}T00:00:00`,
                     "range_upper": `${  DATE_STEPS[i].end_date}T00:00:00`,
                     // "range_lower": `2024-01-01T00:00:00`,
                     // "range_upper": `2024-01-31T00:00:00`,
                  },
               ]
           }
         }
      )
      const response = (await proxying(method, endpoint, header, param, body_x, true));
      // console.log(response)

      if(response.status == 200 ) {
         const raw_data = JSON.parse(response.data).data;
         // const data = {data: raw_data.data.filter(d => d.order_id === '1448935')}
         const data = raw_data
         // console.log(data.data[0])
         const orders = data.data.map(a => {a.create_time2 = (new Date(parseInt(a.create_time * 1000))); return a})
         if(false) {
            console.table(orders.sort((a,b) => parseInt(a.order_id) - parseInt(b.order_id)), [
               "order_id",
               "employee_name",
               "create_time",
               "create_time2"
            ])
         }

         // console.log(data.data.length)
      //   console.table(data.data.map(r => {
      //    const rr = r;
      //    // rr.update_time_h = new Date(parseInt(r.update_time * 1000)) 
      //    // rr.create_time_h = new Date(parseInt(r.create_time * 1000)) 
      //    // rr.last_pending_time_h = new Date(parseInt(r.last_pending_time * 1000)) 

         

      //    return rr
      //   }), ["order_id", "create_time_h","update_time_h", "pending_time", 'last_pending_time',  'last_reply_time', 'last_pending_time_h',
      //       'category_1_name','archive_category'
      //    ])
         records = records.concat( data.data );
      } else {
         console.log(`Get Order list Error !!!`)
         // return null;
      }
   }

   // console.log(`Total Records: ${records.length}`)
   const uniqueRecords = [...new Set(records)]
   console.log(`Total Unique Records:  ${uniqueRecords.length}`)
   return uniqueRecords

   // const uniqueArray = [...new Set(array)];
 
   // const response_3 = (await proxying(method, endpoint, header, param, body, true));

   //  console.log(response.data)

}


// athena_api_v2_swimlane()

module.exports = athena_api_v2_swimlane


/**


pending_time        =>   Pending how many seconds
pending_time = 0    =>   Closed

update_time
   - change question type
   - reply
   - change priority 
   - change section/tag DOES NOT update

last_pending_time
   - reply chan change it
   - close/re-open can change it 

 */