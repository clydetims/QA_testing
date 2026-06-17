import MailosaurClient from 'mailosaur';

const mailosaur = new MailosaurClient(process.env.MAILOSAUR_API_KEY!)

const serverId = process.env.MAILOSAUR_SERVER_ID!;

export async function getVerificationCode(email: string) {
    const message = await mailosaur.messages.get(serverId, { 
        sentTo: email,
    });

    // Mailosaur automatically extracts codes
    return message.html?.codes?.[0]?.value;
}

