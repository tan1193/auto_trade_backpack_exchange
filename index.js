"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const backpack_client_1 = require("./backpack_client");

/// EDIT HERE ///
const API_KEY = "API_KEY"
const API_SECRET = "API_SECRET"
var solToStop = 2.0;
/////////////

function delay(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}


function getNowFormatDate() {
    var date = new Date();
    var separator1 = "-";
    var separator2 = ":";
    var month = date.getMonth() + 1;
    var strDate = date.getDate();
    var strHour = date.getHours();
    var strMinute = date.getMinutes();
    var strSecond = date.getSeconds();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    if (strHour >= 0 && strHour <= 9) {
        strHour = "0" + strHour;
    }
    if (strMinute >= 0 && strMinute <= 9) {
        strMinute = "0" + strMinute;
    }
    if (strSecond >= 0 && strSecond <= 9) {
        strSecond = "0" + strSecond;
    }
    var currentDate = date.getFullYear() + separator1 + month + separator1 + strDate
        + " " + strHour + separator2 + strMinute
        + separator2 + strSecond;
    return currentDate;
}

let successBuy = 0;
let successSell = 0;

const init = async (client) => {
    try {
        console.log("\n============================")
        console.log(`Total Buy: ${successBuy} | Total Sell: ${successSell}`);
        console.log("============================\n")

        console.log(getNowFormatDate(), "Waiting 5 seconds...");
        await delay(5000);

        let userBalance = await client.Balance();
        // log user balance
   

        if (userBalance.USDC.available > 5) {
            await buy(client);
        } else {
           
            await sell(client);
            return;
        }
    } catch (e) {
        console.log(getNowFormatDate(), `Try again... (${e.message})`);
        console.log("=======================")

        await delay(3000);
        init(client);

    }
}



const sell = async (client) => {
    let GetOpenOrders = await client.GetOpenOrders({ symbol: "SOL_USDC" });
    if (GetOpenOrders.length > 0) {
        let CancelOpenOrders = await client.CancelOpenOrders({ symbol: "SOL_USDC" });
        console.log(getNowFormatDate(), "All pending orders canceled");
    }

    let userBalance2 = await client.Balance();
    
    if (userBalance2.SOL.available <= solToStop) {
        // stop trading if balance is less than solToStop
        console.log(getNowFormatDate(), `Balance is less than ${solToStop}, stop trading`);
        return;
    }
    console.log(getNowFormatDate(), `My Account Infos: ${userBalance2.SOL.available} $SOL | ${userBalance2.USDC.available} $USDC`,);

    let { lastPrice: lastPriceAsk } = await client.Ticker({ symbol: "SOL_USDC" });
    console.log(getNowFormatDate(), "Price sol_usdc:", lastPriceAsk);
    let quantity = (userBalance2.SOL.available - 0.02).toFixed(2).toString();
    console.log(getNowFormatDate(), `Trade... ${quantity} $SOL to ${(lastPriceAsk * quantity).toFixed(2)} $USDC`);
    let orderResultAsk = await client.ExecuteOrder({
        orderType: "Limit",
        price: lastPriceAsk.toString(),
        quantity: quantity,
        side: "Ask",
        symbol: "SOL_USDC",
        timeInForce: "IOC"
    })
    if (orderResultAsk?.status == "Filled" && orderResultAsk?.side == "Ask") {
        successSell += 1;
        console.log(getNowFormatDate(), "Sold successfully:", `Order number:${orderResultAsk.id}`);
        init(client);
    } else {
        if (orderResultAsk?.status == 'Expired') {
            throw new Error("Sell Order Expired");
        } else {

            throw new Error(orderResultAsk?.status);
        }
    }
}

const buy = async (client) => {
    let GetOpenOrders = await client.GetOpenOrders({ symbol: "SOL_USDC" });
    if (GetOpenOrders.length > 0) {
        let CancelOpenOrders = await client.CancelOpenOrders({ symbol: "SOL_USDC" });
        console.log(getNowFormatDate(), "All pending orders canceled");
    }
    let userBalance = await client.Balance();
    let balanceSol = 0;
    if (userBalance.SOL) {
        balanceSol = userBalance.SOL.available
    }
    console.log(getNowFormatDate(), `My Account Infos: ${balanceSol} $SOL | ${userBalance.USDC.available} $USDC`,);
    let { lastPrice } = await client.Ticker({ symbol: "SOL_USDC" });
    console.log(getNowFormatDate(), "Price of sol_usdc:", lastPrice);
    let quantity = ((userBalance.USDC.available - 2) / lastPrice).toFixed(2).toString();
    console.log(getNowFormatDate(), `Trade ... ${(userBalance.USDC.available - 2).toFixed(2).toString()} $USDC to ${quantity} $SOL`);
    let orderResultBid = await client.ExecuteOrder({
        orderType: "Limit",
        price: lastPrice.toString(),
        quantity: quantity,
        side: "Bid",
        symbol: "SOL_USDC",
        timeInForce: "IOC"
    })
    if (orderResultBid?.status == "Filled" && orderResultBid?.side == "Bid") {
        successBuy += 1;
        console.log(getNowFormatDate(), "Bought successfully:", `Order number: ${orderResultBid.id}`);
        init(client);
    } else {
        if (orderResultBid?.status == 'Expired') {
            throw new Error("Buy Order Expired");
        } else {
            throw new Error(orderResultBid?.status);
        }
    }
}

(async () => {
    const apiSecret = API_SECRET;
    const apiKey = API_KEY;
    const client = new backpack_client_1.BackpackClient(apiSecret, apiKey);
    init(client);
})()
