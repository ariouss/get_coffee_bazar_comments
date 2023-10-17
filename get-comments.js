const puppeteer = require('puppeteer');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto('https://cafebazaar.ir/app/ir.tipax.mytipax');

    const loadMoreButtonSelector = '.AppCommentsList__loadmore';
    const commentSelector = '.AppComment';

    const commentsData = [];

    while (true) {
        const loadMoreButton = await page.$(loadMoreButtonSelector);
        if (loadMoreButton) {
            await loadMoreButton.click();
            await page.waitForTimeout(2000);
        } else {
            try {
                await page.waitForSelector(loadMoreButtonSelector, { hidden: true, timeout: 60000 });
            } catch (error) {
                console.error("Timed out waiting for more comments.");
            }
            break;
        }
    }

    const comments = await page.$$eval(commentSelector, (commentElements) => {
        return commentElements.map((element) => {
            const username = element.querySelector('.AppComment__username').textContent.trim();
            const date = element.querySelector('.AppComment__meta > div:last-child').textContent.trim();
            const comment = element.querySelector('.AppComment__body').textContent.trim();
            return { username, date, comment };
        });
    });

    console.log(comments);

    const csvWriter = createCsvWriter({
        path: 'comments.csv',
        header: [
            { id: 'username', title: 'Username' },
            { id: 'date', title: 'Date' },
            { id: 'comment', title: 'Comment' },
        ],
    });

    csvWriter.writeRecords(comments)
        .then(() => {
            console.log('CSV file has been written.');
        });

    await browser.close();
})();
