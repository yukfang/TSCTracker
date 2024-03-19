const proxying = require('../http/proxying');
const cookie = require('./cookie');

module.exports =
async function athena_api_v2_processor_order_bind_tag_list(order_id){
    const plat_id = '1736490999244882'
    // const endpoint = `https://ads.tiktok.com/athena/api/v2/processor/order/bind_tag_list`;
    const endpoint = `https://ads.tiktok.com/athena/api/v2/processor/order/bind_tag_list_v2`;
    const method      = 'GET';
    let header      = {Cookie: await cookie()}
    let param       = {
        order_id,
        plat_id,
        archive_after: true,
        lang: 'EN'
    };
    let body        = null;

    const response = (await proxying(method, endpoint, header, param, body, true));
    // console.log(response.data)

    let impl_tags = []
    if(response && response.status == 200 ) {
        const tags  = (JSON.parse(response.data).data.tags)
        // console.log(tags)
        const impl_tags_data = tags.filter(tg => tg.group_name.includes("Implementation Status"))
        // console.log(impl_tags)
        // console.log('  ')
        // const data = JSON.parse(response.data).data.tags.filter(tg => tg.group_name.includes("Implementation Status"));
        // console.log(data.tags.filter(tg => tg.group_name.includes("Implementation Status")))
        if(impl_tags_data.length == 1) {
            // var tagStr = '';
            const tags = impl_tags_data[0].tags;
            // console.log(tags)
            return tags
        }
        for(let i = 0; i < impl_tags_data.length; i++) {
            impl_tags_data[i].tags.forEach(t => {
               // console.log(t)
               impl_tags.push(t)
            });
        }
    } else {
        console.log(`Get Order ${order_id} Tag Error !!!`)
        return null;
    }

    return impl_tags
}

async function test() {
    const response = await athena_api_v2_processor_order_bind_tag_list(1047327);

    // const response = await athena_api_v2_processor_order_bind_tag_list(687672);


    console.log(response)
}

// test();
