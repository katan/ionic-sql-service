import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar, Splashscreen } from 'ionic-native';

import { TabsPage } from '../pages/tabs/tabs';

import {
    SqlStorageService,
    SettingsService
} from '../providers/index';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
    rootPage = TabsPage;

    constructor(platform: Platform, private sqlService: SqlStorageService, private settings: SettingsService,) {
        platform.ready().then(() => {
            // Okay, so the platform is ready and our plugins are available.
            // Here you can do any higher level native things you might need.
            StatusBar.styleDefault();
            Splashscreen.hide();

            // Load settings from json file
            this.settings.load().then(() => {

                // Set sql schema from settings
                this.sqlService.setSqlSchema('SQL.tables', 'SQL.fields').then(()=>{
                    // Check tableA exists
                    this.sqlService.tableExists('tableA').then(
                        (data: any) => {
                            // Table exists
                            if (data.res.rows && data.res.rows.length > 0) {
                                console.log('Table exists');
                            }
                            // Create database schemes
                            else 
                            {
                                this.createDatabaseSchema().then(
                                    (data: any) => {
                                        console.log('create database schema');
                                        // Insert data
                                        this.insertSomeData().then(
                                            () => {
                                                console.log('insert data');

                                                // Update data table A
                                                let newData: Object =  { 'fieldA': 'Dick', 'fieldB': 'Tracy' };
                                                this.sqlService.update('tableA', newData).execute()
                                                    .then((data: any) => {
                                                            if (data.res.rowsAffected > 0) {
                                                                console.log('data updated');
                                                            } else {
                                                                throw new Error("QUERY_NO_UPDATE");
                                                            }
                                                        },
                                                        (error) => {
                                                            throw new Error(error.error);
                                                        })
                                                    .then(() => {
                                                        // Join query
                                                        let joinRes = this.sqlService
                                                            .find(['tableA', 'A'], []) // Empty array to select all fields
                                                            .join('INNER', ['tableB', 'B'], { from: 'A.id', operator: '=', to: 'B.tableAid' })
                                                            .orderBy(['A.id'], 'ASC')
                                                            .execute().then(
                                                                (data) => console.log(data));
                                                    })
                                            });
                                    });
                            }
                        },
                        (error) => {
                            throw new Error(error.error);
                        });
                },
                (error) => {
                    throw new Error(error);
                });
            });
        });
    }

    private createDatabaseSchema (): Promise<any> {
        return this.sqlService.create('tableA').execute()
                .then(() => this.sqlService.create('tableB').execute())
                .then(() => this.sqlService.create('tableC').execute())
                .catch((error) => {
                    throw new Error(error.error)
                });
    }

    private insertSomeData (): Promise<any> {
        // Data to insert
        let tableA: Object = {
            id: 1,
            fieldA: 'hello',
            fieldB: 'world',
            unixtime: Date.now()
        }
        let tableB: Object = {
            id: 1,
            tableAid: 1,
            fieldA: 'hello',
            unixtime: Date.now()
        }
        let tableC: Object = {
            id: 1,
            tableAid: 1,
            tableBid: 1,
            unixtime: Date.now()
        }

        return this.sqlService.insert('tableA', tableA).execute()
            .then(() => this.sqlService.insert('tableB', tableB).execute())
            .then(() => this.sqlService.insert('tableC', tableC).execute())
            .catch((error) => {
                throw new Error(error.error)
             });
    }
}
