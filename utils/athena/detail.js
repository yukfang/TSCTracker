const proxying = require('../http/proxying');
const cookie = require('./cookie');



module.exports = async function athena_api_admin_order_detail(order_id){
    const endpoint = `https://ads.tiktok.com/athena/api/admin/order/detail/`;
    const method      = 'GET';
    let header      = {Cookie: await cookie()}
    let param       = {
        order_id,
        archive_after: true,
        lang: 'EN'
    };
    let body        = null;

    const response = (await proxying(method, endpoint, header, param, body, true));
    // console.log(response.data)

    if(response.status == 200 ) {
        const data = JSON.parse(response.data).data;
        return data;

        // const tracking = {
        //     status: data.status,
        //     follower: data.follower,
        //     create_time: data.create_time,
        //     plat_id: data.plat_id,
        //     id: data.id,
        //     title: data.title,
        //     category_1_name: data.category_1_name,
        //     update_time: data.update_time,
        //     owner_name: data.owner_name,
        //     pending_time: data.pending_time,
        //     // items: data.items,
        //     replies: data.replies,
        //     replies_items: data.replies[0].items

        // }

        // console.log(tracking);

    } else {
        console.log(`Get Order ${order_id} Detail Error !!!`)
        return null;
    }
}

async function getOrderSurvey(order_id){
    const endpoint = `https://ads.tiktok.com/athena/api/admin/order/detail/`;
    const page_size   = 50;
    const method      = 'GET';
    let header      = {Cookie: cookie.value}
    let param       = {
        order_id,
        archive_after: true,
        lang: 'EN'
    };
    let body        = null;

    const response = (await proxying(method, endpoint, header, param, body, true));
    console.log(response.data)

    if(response.status == 200 ) {
        const data = JSON.parse(response.data).data;

        const tracking = {
            status: data.status,
            follower: data.follower,
            create_time: data.create_time,
            plat_id: data.plat_id,
            id: data.id,
            title: data.title,
            category_1_name: data.category_1_name,
            update_time: data.update_time,
            owner_name: data.owner_name,
            pending_time: data.pending_time,
            // items: data.items,
            replies: data.replies,
            replies_items: data.replies[0].items

        }

        console.log(tracking);
        console.log('---')

        for(let i = 0; i < tracking.replies.length; i++) {
            const items = tracking.replies[i].items;
            for(let j = 0; j < items.length; j++) {
                // console.log(items[j]);
                let content = items[i].content.replace(/<p>|<\/p>|<br>/g, '').trim();
                console.log(content);

                const q_num = 8;
                const delimeters = [];
                for(let q = 1; q <= q_num; q++) {
                    delimeters.push('Q' + q);
                    delimeters.push('A' + q);
                }

                console.log(delimeters);

                let survey = [];
                let temp = content.split(/\[Q[0-9]+\]|\[A[0-9]+\]/);

                console.log(temp);
                temp.forEach(element => {
                    let qa = element.trim();
                    if(qa.length != 0) survey.push(qa);
                });
                console.log(survey);
            }
        }

    } else {
        console.log(`response error !!!`)
    }


}

// athena_api_admin_order_detail(826326);
// athena_api_admin_order_detail();