FROM mcr.microsoft.com/dotnet/aspnet:7.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:7.0 AS build
WORKDIR /src
COPY ["todo-backend.API/todo-backend.API.csproj", "todo-backend.API/"]
RUN dotnet restore "todo-backend.API/todo-backend.API.csproj"
COPY . .
WORKDIR "/src/todo-backend.API"
RUN dotnet build "todo-backend.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "todo-backend.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "todo-backend.API.dll"]
