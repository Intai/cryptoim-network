1. Connect to GitHub repo in CodeBuild
2. Execute ./package.sh
3. Create CloudFormation stack
4. Point Route53 to the load balancer
5. Connect to GitHub repo in CodeDeploy settings
6. Create CodeDeploy deployment group
  - DgpECS-{ClusterName}-{StackName}
7. Start CodeBuild with overrides
  - master
  - nginx
