const express = require("express");
const app = express();
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));

let input = "";

app.post("/", function (req, res) {
  input = req.body.input;

  if (input !== "") {
    const puppeteer = require("puppeteer");
    const xlsx = require("xlsx");

    async function getPageData(url, page) {
      //const browser = await puppeteer.launch({headless: false});

      await page.goto(url);
      //await page.screenshot({path: 'example.png'});

      //const h1 = await page.$eval('div.pdp-header > h1 > span.h-boxedright--xs');

      const h1 = await page.$eval(
        "div.product_page_two-column div.pdp-header h1",
        (h1) => h1.innerText
      );
      const price = await page.$eval(
        "div.price-block__highlight > span.promo-price",
        (price) => price.innerText.replace(/\s+/g, " ").trim()
      );
      const brand = await page.$eval(
        "div.pdp-header__meta-item > a",
        (brand) => brand.innerText
      );

      return {
        title: h1,
        price: price,
        brand: brand,
      };

      //console.log(links);

      //await browser.close();
    }

    async function getLinks() {
      const browser = await puppeteer.launch({ headless: true });
      // const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(input);
      const links = await page.$$eval(
        "ul#js_items_content > li.product-item--row > div.product-item__image.hit-area > div.h-o-hidden > a",
        (allAs) => allAs.map((a) => a.href)
      );

      await browser.close();
      return links;
    }

    async function main() {
      const allLinks = await getLinks();

      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      const scrapedData = [];

      for (let link of allLinks) {
        const data = await getPageData(link, page);
        // const secondToWait = (Math.floor(Math.random() * 3) + 1) * 1000
        // await page.waitFor(secondToWait);
        scrapedData.push(data);
      }

      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.json_to_sheet(scrapedData);
      xlsx.utils.book_append_sheet(wb, ws);
      xlsx.writeFile(wb, "links.xlsx");
      // console.log(scrapedData);
      await browser.close();
      console.log("Fini");
    }

    main();
  }
});

app.post("/", function (req, res) {});

app.listen(80, "0.0.0.0");
