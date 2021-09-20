const puppeteer = require('puppeteer')
const tpURL = "https://www.trustpilot.com/review/meetharmony.com?languages=all"
const ObjectsToCsv = require('objects-to-csv')

const spawnBrowser = async () => {
    const browser = await puppeteer.launch({headless: true} ); //{ headless: false,devtools: true } {args: ['--no-sandbox']}
    const page = await browser.newPage();
    return {browser,page}
}

const extractTrustPilotReviews = async ({...obj}) => {
    const {page,browser,tpURL} = obj
    await page.goto(tpURL)
    await page.click("button#onetrust-accept-btn-handler")
    const reviews = new Array()
    while (true) {
        await page.waitForSelector("div.review-card")
        const reviewCards = await extractReviewsFromPage({page})
        try {
            var isMore = await page.evaluate(()=>{
                return document.querySelector(".pagination-container > a:last-child").innerText.trim() === 'Next page'
            })
        } catch{
            var isMore = false
        }
        reviews.push(reviewCards)
        if (!isMore) break
        await page.click(".pagination-container > a:last-child")
    }
    return reviews

}

const extractReviewsFromPage = async ({...obj})=> {
    const {page} = obj
    return await page.evaluate(()=>{
        debugger
        const cards = document.querySelectorAll("div.review-card")
        // The return value for page.evaluate() must be serializable.
        // TIL Array.From takes a callback map function
        const reviews = new Array()
        for (const index in cards) {
            debugger
            try{
                reviews.push(
                    {
                        body : cards[index].querySelector(".review-content__body").innerText,
                        title : cards[index].querySelector(".review-content__title").innerText,
                        name : cards[index].querySelector(".consumer-information__name").innerText,
                        rating : cards[index].querySelector(".star-rating > img")["alt"].split(" ")[0]
                    }
                )
            } catch (err) {
                debugger
            }
        }
        return reviews
    })
}

const main = async ()=>{
    try {
        const {page,browser} = await spawnBrowser()
        const reviews = await extractTrustPilotReviews({page,browser,tpURL})
        const csv = new ObjectsToCsv(reviews)
        await csv.toDisk('./reviews.csv',{ append: true })
    } catch (err) {
        debugger
    }
}

main()