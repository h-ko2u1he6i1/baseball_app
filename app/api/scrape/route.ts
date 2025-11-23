import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export async function POST(request: Request) {
  try {
    const { date } = await request.json();
    if (!date || typeof date !== 'string') {
      return NextResponse.json({ error: 'Date is required and must be a string' }, { status: 400 });
    }

    const [year, month, day] = date.split('-').map(Number);
    if (!year || !month || !day) {
      return NextResponse.json({ error: 'Invalid date format. Expected YYYY-MM-DD' }, { status: 400 });
    }

    const command = `npm run scrape -- ${year} ${month} ${date}`;
    console.log(`Executing command: ${command}`);

    const { stdout, stderr } = await execPromise(command);

    if (stderr) {
      console.warn(`Scraping script warnings: ${stderr}`);
    }

    console.log(`Scraping script output: ${stdout}`);
    return NextResponse.json({ message: `Scraping successful: ${stdout}` });

  } catch (error: any) {
    console.error('Error in scrape API route:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
