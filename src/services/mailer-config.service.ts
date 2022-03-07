import {Injectable} from "@nestjs/common";
import {MailerOptionsFactory} from "@nestjs-modules/mailer";
import {ConfigService} from "@nestjs/config";
import {MailerOptions} from "@nestjs-modules/mailer/dist/interfaces/mailer-options.interface";

@Injectable()
export class MailerConfigService implements MailerOptionsFactory {
    constructor(private configService: ConfigService) {
    }

    createMailerOptions(): MailerOptions {
        return {
            transport: {
                host: this.configService.get<string>('MAIL_HOST'),
                port: this.configService.get<number>('MAIL_PORT'),
                secure: this.configService.get<boolean>('MAIL_IS_SECURE'), // true for 465, false for other ports
                auth: {
                    user: this.configService.get<string>('MAIL_USERNAME'),
                    pass: this.configService.get<string>('MAIL_PASSWORD'),
                },
            },
            defaults: {
                from: this.configService.get<string>('MAIL_COMPANY_NAME') + ' <' + this.configService.get<string>('MAIL_ADDRESS') + '>',
            },
        };
    }
}
