import {registerDecorator, ValidationOptions} from "class-validator";
import moment from "moment";

export function IsOneHourAfter(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isOneHourAfter',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any) {
                    return typeof value === 'string' && moment(value).utc().isAfter(moment().utc().add(1, 'hour')); // you can return a Promise<boolean> here as well, if you want to make async validation
                },
            },
        });
    };
}
