Ionic SQL service
=====================

This is another SQLite provider solution write in typerscript for Ionic version 2 & 3.
The master branch have the latest Ionic version supported (3.x.x), use the tags to get other versions like 2.3.0

## Using this project

You'll need the last Ionic CLI:
More info on this can be found on the Ionic [Getting Started](http://ionicframework.com/getting-started) page.

## Dependencies

This provider use another one called settingsService for separate the database schema in a external config file, but you can leave out it.

## Database schema setting

The database schema are the same using or not the setting provider.
There two arrays, one of them, the list of the tables available, the other one the list of fields for every table and their references with the others.

#### Tables
```typescript
let tables = ["tableA","tableB","tableC"];
```

#### Fields and their references
```typescript
let fields = {
	"tableA": ["fieldA TEXT","fieldB TEXT","unixtime INTEGER"], // Table without references
	"tableB": ["tableAid INTEGER","fieldA TEXT","unixtime INTEGER", // Table with references
		["tableAid","tableA","id"]], // 0 => foreign key, 1 => reference table, 2 => reference key
	"tableC": ["tableAid INTEGER","tableBid INTEGER","unixtime INTEGER",
		["tableAid","tableA","id"], // Adding more references
		["tableBid","tableB","id"]]
};
```

## Using this SQL Service

You can see a basic use on _app/app.component.ts_ checking if table exists or is the first time _(or also the user has removed data)_ creating the database schema. It's usefull for a welcome page for example.


#### Create table:
```typescript
this.sqlService.create('myNewTable').execute(); // Return a promise
```

#### Insert a single data:
```typescript
this.sqlService.insert('myNewTable', {
	'name': 'Dick',
	'lastName': 'Tracy'
}).execute(); // Return a promise
```

#### Insert a multiple data: *(from the @pablopereira27 fork)*
```typescript
let multipleInserts: Object[] = [{'name': 'Dick','lastName': 'Tracy'},{'name': 'Big Boy','lastName': 'Caprice'}];
this.sqlService.insert('myNewTable', multipleInserts).execute(); // Return a promise
```

#### Update data:
```typescript
this.sqlService.update('myNewTable', {
		'name': 'Bruce',
		'lastName': 'Wayne'
	})
	.where([{ 'field': 'id', 'value': 1, 'operator': '=', 'table': 'myNewTable' }])
	.execute(); // Return a promise
```

#### Find data:
###### Simple find _(return all fields)_
```typescript
this.sqlService.find('myNewTable', []).execute(); // Return a promise
```
###### Simple find returning specific fields
```typescript
this.sqlService.find('myNewTable', ['name', 'lastname']).execute(); // Return a promise
```
###### Simple find using order by and group by
```typescript
this.sqlService.find('myNewTable', ['name', 'lastname'])
	.groupBy(['category'])
	.orderBy(['id, name'], 'ASC')
	.execute(); // Return a promise
```
###### Find using where conditions
```typescript
this.sqlService.find('myNewTable', ['name', 'lastname'])
	.where([
		{ field: 'name', operator: '=', value: 'Bruce', table: 'myNewTable' },
		'AND (',
		{ field: 'language', operator: '=', value: 'es_ES', table: 'myNewTable' },
		'OR',
		{ field: 'language', operator: '=', value: 'en_GB', table: 'myNewTable' },
		')'])
	])
	.execute(); // Return a promise
```
###### Complex find using joins
```typescript
this.sqlService
	.find(['myNewTable', 'A'], ['A.id', 'A.name', 'A.lastname AS category', 'sum(B.amount) AS amount', 'C.unit'])
	.join('LEFT', ['tableB', 'B'],  { from: 'B.tableAId', operator: '=', to: 'A.id' })
	.join('LEFT', ['tableC', 'C'],  { from: 'C.tableBId', operator: '=', to: 'B.id' })
	.join('INNER', ['tableD', 'D'],  { from: 'D.tableCId', operator: '=', to: 'C.anotherId' })
	.where([
	    { field: 'C.id', operator: '<>', value: 1, table: 'tableC' }
    ])
	.groupBy(['C.id', 'C.unit'])
	.orderBy(['D.name', 'C.name'], 'ASC')
	.execute(); // Return a promise
```

#### Transactions

You can use transactions but only works over Android 4.1 or higher. **Over Web SQL don't works!**
```typescript
if (this.sqlService.hasTransaction()){
  this.sqlService.beginTransaction(true)
    .insert('myNewTable', {'name': 'Dick','lastName': 'Tracy'})
    .insert('myNewTable', {'name': 'Bruce','lastName': 'way'})
    .update('myNewTable', {'lastName': 'Wayne'})
    .execute();
}
```

#### Delete data:
```typescript
this.sqlService.delete('myNewTable')
	.where([{
		field: 'id',
		operator: '=',
		value: 1,
		table: 'myNewTable'
	}])
	.execute(); // Return a promise
```

#### Drop table:
```typescript
this.sqlService.dropTable('myNewTable').execute(); // Return a promise
```
