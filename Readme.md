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
Now lets do checkout for only apps **(NA APP NAME)** that you in need in NX Monorepo. Shalo computes the dependencies within nx and will checkout all the required dependent apps in the monorepo
```
shalo checkout -a <NX-APP/NX-PROJECT_NAME>
```
you can exclude the dependent apps as well. But be careful using this, as it may break nx build or any nx commands

Add Folders or Projects
```
shalo add <FOLDER_NAME>
```
To add an NX project and its dependencies:
```
shalo add <NX_PROJECT_NAME>
```

```
shalo checkout -a <APP/PROJECT_NAME> -e  <NX-EXCLUDED_APP_NAME>
```

In addition you may need to add folders in the monorepo like mocks, tools etc to add folders. You should **NOT** provide **nx project name** here.
```
shalo add <FOLDER_NAME>

```
To come out of sparse checkout mode or to disable it and use git cli
```
shalo clean
```

