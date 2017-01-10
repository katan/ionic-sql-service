import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

/**
 * Service for local storage.
 * The local storage should be use only for a current session.
 */
@Injectable()
export class SettingsService {
	public static SETTINGS_URL: string = "assets/settings.json";
	private _loadSettings: Observable<any>;
	private _settings: any;

	constructor (private http: Http) {
		try {
			this._loadSettings = new Observable(observer => {
				if (this._settings) {
					observer.complete();
				} else {
			        this._settings = {};
					this.http.get(SettingsService.SETTINGS_URL)
						.map(res => res.json())
			            .subscribe(data => {
			                this.setObject(data);
			                observer.complete();
			            });
				}
			});
		} catch (error) {
			throw new Error(error.message);
		}
	}

	public load(): Promise<any> {
		return new Promise((resolve, reject) => {
			try {
				this._loadSettings.subscribe(
					(value) => {},
					(error) => reject({error: error}),
					()=> {
						resolve(true);
					});
			} catch (error) {
				reject(error);
			}
		})
	}

	public get(key: string = undefined): Promise<any> {
		return new Promise((resolve, reject) => {
			try {
				this._loadSettings.subscribe( (value) => {}, (error) => {},
					()=> {
						if (key && this._settings[key]) {
							resolve(this._settings[key]);
						}
						if (key && key.indexOf('.') > 0) {
							resolve(this._interpolateKey(key) || this._settings);
						}
						resolve(this._settings);
					});
			} catch (error) {
				reject({error: error});
			}
		});
	}

	public set(key: string, value: any): void {
		this._settings[key] = value;
	}

	public setObject (object: any): void {
		for (let key in object) {
			this.set(key, object[key]);
		}
	}

	private _interpolateKey (key): string {
		let _value: any;
		let _keys = key.split('.');

		for (let i = 0; i < _keys.length; i++) {
			if (i === 0) _value = this._settings[_keys[i]];
			else _value = _value[_keys[i]];
		}

		return _value;
	}
}