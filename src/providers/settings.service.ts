import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

/**
 * Simple service to load settings from a file.
 */
@Injectable()
export class SettingsService {
	private filePath: string;
	private _loadSettings: Observable<any>;
	private _settings: any;

	constructor (private http: Http) {
		try {
	        this._settings = {};
			this._loadSettings = new Observable(observer => {
				this.http.get(this.filePath)
					.map(res => res.json())
		            .subscribe(data => {
		                this.setObject(data);
		                observer.complete();
		            });
			});
		} catch (error) {
			throw new Error(error.message);
		}
	}

	/**
	 * Load the file
	 * @param  {string}       filePath
	 * @return {Promise<any>}
	 */
	public load(filePath: string): Promise<any> {
		this.filePath = filePath;
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

	/**
	 * 
	 * @param  {string = undefined}   key [description]
	 * @return {Promise<any>}
	 */
	public get(key: string = undefined): Promise<any> {
		return new Promise((resolve, reject) => {
			try {
					if (key && this._settings[key]) {
						resolve(this._settings[key]);
					}
					if (key && key.indexOf('.') > 0) {
						resolve(this._interpolateKey(key) || this._settings);
					}
					!key && resolve(this._settings) ||  reject('No key exists');
			} catch (error) {
				reject({error: error});
			}
		});
	}

	/**
	 * Set a key and their value on the root of the service
	 * @param {string} key   [description]
	 * @param {any}    value [description]
	 */
	public set(key: string, value: any): void {
		this._settings[key] = value;
	}

	/**
	 * Set a javascript object on the root of the service
	 * @param {any} object 		example: { 'mykey1':'myValue1', 'mykey2':'myValue2', ... }
	 */
	public setObject (object: Object): void {
		for (let key in object) {
			this.set(key, object[key]);
		}
	}

	/**
	 * Search the value through a interpolate key
	 * @param  {string} key 	path to value, examples: "path1.myKey", "path1.path2.myKey", ...
	 * @return {string}			the value
	 */
	private _interpolateKey (key:string): string {
		let _value: any;
		let _keys = key.split('.');

		for (let i = 0; i < _keys.length; i++) {
			if (i === 0) _value = this._settings[_keys[i]];
			else _value = _value[_keys[i]];
		}

		return _value || '';
	}
}