import { Notification } from '../../apiClasses/notification';
import { APIProvider } from '../../providers/APIProvider';
import { Component } from '@angular/core';
import { InfiniteScroll, NavController, NavParams } from 'ionic-angular';

/*
  Generated class for the Notifications page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-notifications',
  templateUrl: 'notifications.html'
})
export class NotificationsPage {

  notifications: Notification[];

  constructor(public navCtrl: NavController, public navParams: NavParams, public mastodon: APIProvider) {
    let notificationCacheString = localStorage.getItem('notificationsCache');
    if(notificationCacheString){
      console.log('notifications loading from cache....')
      this.notifications = JSON.parse(notificationCacheString);
    } else {
      this.getNotifications();
    }
  }

  getNotifications(){
    this.mastodon.getNotifications().map( res => {
      let tempNotifications: Notification[] = JSON.parse(res['_body']);
      return tempNotifications;
    })
    .subscribe(
      data=>  {
        this.notifications = data;
        this.cacheContent();
      },
      error => console.log(JSON.stringify(error))
    );

  }

  doRefresh(refresher) {
    let id = this.notifications[0].id;
    this.mastodon.getNotifications(undefined,id)
    .map( res => {
      let tempNotifications: Notification[] = JSON.parse(res['_body']);
      return tempNotifications;
    })
    .subscribe(
      data=>  {
        if(data){
          let newNotifications: Notification[] = data;
          if(newNotifications.length < 20 && this.notifications.length < 100){
            this.notifications = newNotifications.concat(this.notifications)
          } else {
            this.notifications = newNotifications;
          }
          this.cacheContent();
          setTimeout(() => {
            console.log('refresh completed');
            refresher.complete();
          }, 500);
        }
      },
      error => console.log(JSON.stringify(error))
    );
  }

  loadOlderNotifications(infiniteScroll: InfiniteScroll){
    let id = this.notifications[this.notifications.length -1].id;
    this.mastodon.getNotifications(id)
    .map( res => {
      let tempNotifications: Notification[] = JSON.parse(res['_body']);
      return tempNotifications;
    })
    .subscribe(
      data=>  {
        if(data){
          let newNotifications: Notification[] = data;
          for(var i = 0; i < newNotifications.length; i++){
            this.notifications.push(newNotifications[i]);
          }
          infiniteScroll.complete();
        }
      }),
      error => {
        console.log(JSON.stringify(error))
        infiniteScroll.complete();
    }
  };

  public cacheContent(){
    localStorage.setItem('notificationsCache', JSON.stringify(this.notifications))
    console.log('notifications are cached!')
  }

}
