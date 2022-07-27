import moment from 'moment';
import { Category } from './category.type';

export class Entry {

    private _category: Category;
    private _message: string;
    private _tracker: string;
    private _object: string;
    private _datetime: moment.Moment;

    constructor(
        category: Category,
        message: string,
        tracker?: string,
        object?: any,
    ) {
        this._category = category;
        this._message = message;
        this._tracker = tracker;
        this._object = object;
        this._datetime = moment.utc();
    }

    public datetime(): moment.Moment {
        return this._datetime;
    }
    public category(): Category {
        return this._category;
    }
    public message(): string {
        return this._message;
    }
    public tracker(): string {
        return this._tracker;
    }
    public details(): string {
        return this._object ? JSON.stringify(this._object) : '';
    }
    public json(): any {
        return {
            category: this.category(),
            datetime: this.datetime().toISOString(),
            message: this.message(),
            tracker: this.tracker(),
            details: this.details(),
        };
    }

}