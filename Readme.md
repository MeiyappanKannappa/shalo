## Shalo - Optimize Git size for Nx Monorepo

#### Inspired by [tiktok sparo](https://github.com/tiktok/sparo) for Rushjs

A typical NX Monorepo folder structure would like the image below, how the git operations would be if the number of apps are on higher side with N number of dependencies on the shared libraries. Here comes to the rescue git shallow clone and sparse checkout. 
![image](https://github.com/user-attachments/assets/70887c17-fd06-45ac-bf7b-e616db105634)

However it will be difficult to educate hundreds of engineer operating on the monorepo working on various apps, perhaps even to idenify the list of shared packages / components their app needs. #### shalo is a cli tool based on nodejs to solve this problem.
