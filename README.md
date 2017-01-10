Ionic 2 sql service
=====================

This is another SQLite provider solution write in typerscript for Ionic 2.

## Using this project

You'll need the last Ionic CLI with support for v2 apps:
More info on this can be found on the Ionic [Getting Started](http://ionicframework.com/docs/v2/getting-started/) page.

## Dependencies

This provider use another one called settingsService for separate the database schema in a external config file, but you can leave out it.

## Using this SQL Service

You can see a basic use on _app/app.component.ts_ checking if table exists or is the first time _(or also the user has removed data)_ creating the database schema. It's usefull for a welcome page for example.


#### Create table:
```typescript
this.sqlService.create('myNewTable').execute(); // Return a promise
```

#### Insert data:
```typescript
this.sqlService.insert('myNewTable', {
	'name': 'Dick',
	'lastName': 'Tracy'
}).execute(); // Return a promise
```

#### Update data:
```typescript
this.sqlService.update('myNewTable', {
	'name': 'Bruce',
	'lastName': 'Wayne'
}).execute(); // Return a promise
```

#### Find data:
###### Simple find _(return all fields)_
```typescript
this.sqlService.find('myNewTable', []).execute(); // Return a promise
```
###### Simple find usign specific fields
```typescript
this.sqlService.find('myNewTable', ['name', 'lastname']).execute(); // Return a promise
```
###### Simple find usgin order by and group by
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