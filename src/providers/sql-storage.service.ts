import { Injectable } from '@angular/core';
import { SQLite } from '@ionic-native/sqlite';

import { SettingsService } from '../providers/index';

const DB_NAME: string = '__yourDataBase';
const DB_LOCATION: string = 'default';
const win: any = window;

/**
 * Service for local storage.
 * The local storage should be use for a current session.
 */
@Injectable()
export class SqlStorageService {
	// Properties
	private _query: string;
	private _db: any; // SQLite / WebSQL
	private _tables: string[];
	private _fields: any;
	private _transaction: boolean = false;

	constructor(private settings: SettingsService) {
		try {
			if (win.sqlitePlugin) {
				// User native sqlite
				this._db = new SQLite();
				this._db.openDatabase({
					name: DB_NAME,
					location: DB_LOCATION // the location field is required
				});
			} else {
				// webSQL wrapper
				this._db = win.openDatabase(DB_NAME, '1.0', 'database', 5 * 1024 * 1024);
			}

		} catch (error) {
			throw new Error(error);
		}
	}

	public setSqlSchema (tables, fields): Promise<any> {
		return this.settings.get(tables)
			.then(
				(data) => this._tables = data
			).then(()=>{
				this.settings.get(fields).then((data) => this._fields = data);
			});
	}

	public tableExists (tableName: string, create: boolean = false): Promise<any> {
		if (this._hasTable(tableName)) {

			this._query = "SELECT name FROM sqlite_master WHERE type='table' AND name='"+ tableName +"';";
			// Return promise
			return (create) 
				? this.create(tableName).execute()
				: this.execute(this._query);
		}
		return Promise.reject('QUERY_NO_TABLE');
	}

	public beginTransaction (status: boolean): SqlStorageService {
		this._query = "BEGIN TRANSACTION;";
		this._transaction = status;
		return this;
	}

	public create (tableName: string): SqlStorageService {
		if (this._hasTable(tableName)) {
			let query: string;
			query = 'CREATE TABLE IF NOT EXISTS ' + tableName + '(id INTEGER PRIMARY KEY AUTOINCREMENT';
			for (let field of this._fields[tableName]) {
				// create foreign keys
				if (Array.isArray(field)) {
					let foreingKey = ', FOREIGN KEY';

					for (let pos in field) {
						if (pos === "0") foreingKey += '('+ field[pos] +')';
						if (pos === "1") foreingKey += ' REFERENCES '+ field[pos];
						if (pos === "2") foreingKey += '('+ field[pos] +')';
					}
					query += foreingKey + " ON DELETE CASCADE";
				} else {
					query += ', '+ field;
				}
			}
			query += ');';
			this._setQuery(query);
		}
		return this;
	}

	public insert (tableName: string, values: any): SqlStorageService {
		if (this._hasTable(tableName)) {
			// Check multiple inserts or single
			if(values instanceof Array) {
				this._multipleInsert (tableName, values);
			} 
			else {
				this._singleInsert (tableName, values);
			}
		}
		return this;
	}

	public update (tableName: string, values: any): SqlStorageService {
		if (this._hasTable(tableName)) {
			let query: string;
			query = 'UPDATE ' + tableName + ' SET';

			for (let field in values) {
				if (this._getFieldType(tableName, field) === "TEXT") {
					query += ' ' + field + '=\"' + values[field] + '\",';
				} else {
					query += ' ' + field + '=' + values[field] + ',';
				}
			}
			query = query.substring(query.length-1, 0);
			this._setQuery(query);
		}
		return this;
	}

	public delete (tableName: string): SqlStorageService {
		if (this._hasTable(tableName)) {
			let query: string = 'DELETE FROM ' + tableName;
			this._setQuery(query);
		}
		return this;
	}

	/**
	 * Prepare the select statement
	 * @param  {string[]}          table[0] = table_name, table[1] = alias
	 * @param  {string[]}          fields for select statement (see select method)
	 * @return {SqlStorageService}
	 */
	public find (table: string[], fields: string[], distinct:boolean = false): SqlStorageService {
		if (this._hasTable(table[0])) {
			// Create a select query start
			this.select (fields, distinct);

			this._query += ' FROM ' + table[0] + (table[1] ? ' AS '+ table[1] : '');
		}
		return this;
	}

	/**
	 * @param  {string[]}			empty array [] for all fields *
	 * @param  {boolean}			disctinct option
	 * @return {SqlStorageService}
	 */
	public select (fields: string[], distinct:boolean = false): SqlStorageService {
		let query: string;
		query = 'SELECT';
		if (distinct) {
			query += ' DISTINCT';
		}

		if (fields && fields.length > 0) {
			for (let field of fields) {
				query += ' ' + field +',';
			}
			query = query.substring(query.length-1, 0);
		} else {
			query +=' *';
		}
		this._setQuery(query);
		return this;
	}

	/**
	 * Examples: [{field: 'recipeID', value: 12, operator: '=' , table: 'tableName'}, 'AND', {...}, 'OR', {...}, '(', {...}, ')', ...]
	 * @param  {any[]}             values: {field:'', value: '', operator: 'comparison Operators'} | ['AND'|'logical operator'...]
	 * @return {SqlStorageService}
	 */
	public where (values: any[]): SqlStorageService {
		this._query += ' WHERE';

		for (let value of values) {
			// logical operator
			if (typeof value === 'string') {
				this._query += ' ' + value; // ex: 'AND', 'OR' ...
			}
			else {
				if (this._getFieldType(value.table, value.field) === "TEXT") {
					this._query += ' ' + value.field + ' ' + value.operator + ' ' + '\"' + value.value + '\"';
				} else {
					this._query += ' ' + value.field + ' ' + value.operator + ' ' + value.value;
				}
			}
		}
		return this;
	}

	/**
	 * @param {string}   type   LEFT, INNER ...
	 * @param {string[]} table  ['tablename'[, 'alias']]
	 * @param {any}      fields { from: 'tableA.id', operator: '=', to: 'tableB.tableAid' }
	 * @return {SqlStorageService}
	 */
	public join (type: string, table: string[], fields: any): SqlStorageService {
		if (this._hasTable(table[0])) {
			this._query += ' ' + type.toUpperCase() + ' JOIN';
			// Add join table
			this._query += ' ' + table[0] + (table[1] ? ' AS '+ table[1] : '');
			this._query += ' ON ' + fields.from + fields.operator + fields.to;
		}
		return this;
	}

	public orderBy (fields: string[], sort: string): SqlStorageService {
		this._query += ' ORDER BY';
		for (let field of fields) {
			this._query += ' ' + field +','
		}
		this._query = this._query.substring(this._query.length-1, 0);
		this._query += ' ' + sort;
		return this;
	}

	public groupBy (fields: string[]): SqlStorageService {
		this._query += ' GROUP BY';
		for (let field of fields) {
			this._query += ' ' + field +','
		}
		this._query = this._query.substring(this._query.length-1, 0);
		return this;
	}

	public execute (query: string = undefined, params: any[] = []): Promise<any> {
		return new Promise((resolve, reject) => {
			try {
				this._db.transaction(
					(tx: any) => {
						let _query: string = (query || this._query);
						if (this._transaction) {
							_query += "END TRANSACTION;";
						}
						tx.executeSql(_query, params,
							(tx: any, res: any) => resolve({tx: tx, res: res}),
							(tx: any, error: any) => reject({tx: tx, error: error})
						);
						this._transaction = false;
				  	},
					(error: any) => {
						this._transaction = false;
						reject({error: error || 'QUERY_UNKNOWN'});
					}
				);
			} catch (error) {
				reject({error: error || 'QUERY_TRANSACTION_UNKNOWN'});
			}
		});
	}

	public dropTable (tableName: string): SqlStorageService {
		let query: string = 'DROP TABLE IF EXISTS ' + tableName;
		this._setQuery(query);
		return this;
	}

	public getQuery (): string {
		return this._query;
	}

	private _hasTable (tableName: string): boolean {
		return (this._tables.indexOf(tableName) > -1 && this._fields[tableName])
	}

	private _getFieldType (tablename: string, field: string): string {
		let _field: string[] = field.split('.');
		let searchResult = this._fields[tablename].filter(function(element) {
			return element.indexOf(_field.length > 1 ? _field[1]: _field[0]) > -1;
		});
		if (searchResult.length > 0 && typeof searchResult[0] === 'string') {
			return searchResult[0].split(' ')[1] || 'INTEGER';
		}
		return 'INTEGER';
	}

	private _singleInsert (tableName: string, values: any) {
		let query: string;
		query = 'INSERT INTO ' + tableName + ' (';

		// Add fields
		for (let field in values) {
			query += field +', ';
		}

		query = query.substring(query.length-2, 0);
		query += ') VALUES (';

		// Add values
		for (let field in values) {
			// Check if string
			if (this._getFieldType(tableName, field) === "TEXT") {
				query += '\"' + values[field] +'\", ';
			}
			// Is a number 
			else {
				query += values[field] +', ';
			}
		}

		query = query.substring(query.length-2, 0);
		query += ');';
		this._setQuery(query);
	}

	/**
	 * Receives an array of objects and add several rows in the same insert
	 * @param {string} tableName
	 * @param {any[]}  values    Array of objects to insert
	 */
	private _multipleInsert (tableName: string, values: any[]) {
		let query: string;
		for (let i = 0; i < values.length; i++) {
			if(i == 0) {
				query = 'INSERT INTO ' + tableName + ' (';

				for (let field in values[i]) {
					query += field +', ';
				}

				query = query.substring(query.length-2, 0);
				query += ') VALUES';
			}

			query += ' (';

			let row = values[i];

			// Add values
			for (let field in row) {
				// Check if string
				if (this._getFieldType(tableName, field) === "TEXT") {
					query += '\"' + row[field] +'\", ';
				}
				// Is a number 
				else {
					query += row[field] +', ';
				}
			}

			query = query.substring(query.length-2, 0);
			query += ')';
			query += (i == values.length - 1) ? ';' : ',';
		}
		this._setQuery(query);
	}

	private _setQuery (query: string) {
		if (this._transaction) {
			this._query += query;
		} else {
			this._query = query;
		}
	}
}