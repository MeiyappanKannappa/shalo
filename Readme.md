## Shalo - Optimize Git size for Nx Monorepo

#### Inspired by [tiktok sparo](https://github.com/tiktok/sparo) for Rushjs

A typical NX Monorepo folder structure would like the image below, how the git operations would be if the number of apps are on higher side with N number of dependencies on the shared libraries. Here comes to the rescue git shallow clone and sparse checkout. 
![image](https://github.com/user-attachments/assets/70887c17-fd06-45ac-bf7b-e616db105634)

However it will be difficult to educate hundreds of engineer operating on the monorepo working on various apps, perhaps even to idenify the list of shared packages / components their app needs. #### shalo is a cli tool based on nodejs to solve this problem.

### Install Shalo in your machine 
```
npm install -g git+git@github.com:MeiyappanKannappa/shalo.git 
```
* This can be used in your CI Pipelines as well*

Clone your repo
```
shalo clone <GITREPO_URL>
(or)
npx shalo clone <GITREPO_URL>
```
Install Dependencies in your repo

```
npm/yarn install
```
Now lets do checkout for only apps **(NA APP NAME)** that you in need NX Monorepo. Shalo computes the dependencies within nx and will checkout all the required dependent apps in the monorepo
```
shalo checkout -a <NX-APP/NX-PROJECT_NAME>
```
You can exclude the dependent apps as well. But be careful using this, as it may break nx build or any nx commands
```
shalo checkout -a <APP/PROJECT_NAME> -e  <NX-EXCLUDED_APP_NAME>
```
Similarly you can checkout for only folders that you need in NX Monorepo. This command will not compute any dependencies within nx and will checkout only that folder in monorepo
```
shalo checkout -f <Folder_name>
```

In addition you may require to add folders in the sparse mode monorepo like mocks, tools etc to add folders.
```
shalo add -f <FOLDER_NAME>
```
Additionaly you can also add **(APP_NAME)** to sparse repo using the below command when you run this command it will also add the respective dependencies to sparse mode repo.
```
shalo add -a <NX-APP/NX-PROJECT_NAME>
```
To come out of sparse checkout mode or to disable it and use git cli
```
shalo clean
```
