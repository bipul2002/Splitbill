import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GroupDetailsService } from '../services/group-details.service';
import Swal from 'sweetalert2';
import { 
  FormGroup,
  FormBuilder, 
  Validators,
  FormArray,
  ValidatorFn,
  FormControl,
  AbstractControl
} from '@angular/forms';
import { __values } from 'tslib';
import { forkJoin } from 'rxjs';
import { GroupsService } from '../services/groups.service';
import { LoginService } from '../services/login.service';


@Component({
  selector: 'app-group-details',
  templateUrl: './group-details.component.html',
  styleUrls: ['./group-details.component.css']
})
export class GroupDetailsComponent implements OnInit{

  expenseForm: any;

  start = false;

  currentGroup =  {
    groupName: ""
  };

  currentSplitExpense = {
    user: {
      userId: 1,
      name: ''
    },
    expense: {
      expenseId: 1,
      description: ''
    },
    amount: 10,
    isPaid: false
  }

  groupId: number;

  groupMembers = [
    {
      "userId": 1,
      "name": "Demo"
    }
  ];
  expenses = [
    {
      expenseId: 1,
      description: "Mirik",
      amount: 100,
      upiId: "demoUpiId",
      date: "2023-11-02",
      addedBy: {
        userId: 2,
        name: "souvik nandi",
        email: "svk@gmail.com",
        password: "123"
      },
      group: {
        groupId: 2,
        groupName: "Demo"
      }
    }
  ]

  loggedInUser = {
    "userId": 1,
    "name": "Souvik",
    "email": "svk@gmail.com",
    "password": "456"
   } 
   
   expenseDetails = {
    description: "",
    amount: 100,
    upiId: "",
    date: "",
    addedBy: {
      userId: 2,
      name: "Demo"
    },
    group: {
      groupId: 12
    },
    membersInvolved : []
   };

   expenseSettled = false;

   expenseInModal = {
    expenseId: 1,
    description: "Mirik",
    amount: 100,
    upiId: "demoUpiId",
    date: "2023-11-02",
    addedBy: {
      userId: 2,
      name: "souvik nandi",
      email: "svk@gmail.com",
      password: "123"
    },
    group: {
      groupId: 2,
      groupName: "Demo"
    }
  };

  splitExpensesInModal = [
    {
      user: {
        userId: 1,
        name: '',
        email: ''
      },
      expense: {
        expenseId: 1,
        description: ''
      },
      amount: 10,
      isPaid: false
    }
  ] 

  splitExpensesToBeDeleted = [
    {
      splitExpenseId: 1
    }
  ]

  // splitExpenseUnequally = [
  //     {
  //       "userId": 1,
  //       "name": "Demo",
  //       "amount": 0
  //     }
  // ]

  splitEqually = false;
  splitUnequally = false;
  splitByPercent = false;
  splitByShares = false;

  constructor(
      private _route: ActivatedRoute,
      private _groupDetails: GroupDetailsService,
      private formBuilder: FormBuilder,
      private _login: LoginService
    )
    {
      this.groupId = this._route.snapshot.params['groupId'];
    }

  ngOnInit(): void {

    this.getGroupDetails();

    this.getGroupMembers();
    
    this.getExpenses(); 

    this.initiateExpenseForm();   
    
    this.getCurrentUser();
    
  }

  private getCurrentUser(){
    this._login.getCurrentUser().subscribe((data: any)=>{
      this.loggedInUser = data;
    })
  }

  // get group details
  private getGroupDetails(){
    this._groupDetails.getGroupDetails(this.groupId).subscribe((data: any)=>{
      this.currentGroup = data;      
    },
    (error)=>{
      console.log(error);
    })
    
  }

  // get members of expense
  get membersOfExpense(){
    return (this.expenseForm.get('membersOfExpense') as FormArray).controls;
  }

  // get splitExpenseUnequally(){
  //   return (this.expenseForm.get('splitExpenseUnequally') as FormArray).controls;
  // }

  private populateCheckboxes(){
    this.groupMembers.forEach(()=>{
      const control = this.formBuilder.control(true); // Initialize as checked
      (this.expenseForm.get('membersOfExpense') as FormArray).push(control);
    });
  }

  // private populateSplitExpenseUnequally(){
  //   this.groupMembers.forEach(()=>{
  //     const control = this.formBuilder.control(0); // Initialize as 0
  //     (this.expenseForm.get('splitExpenseUnequally') as FormArray).push(control);
  //   });
  // }

  // Get group members
  getGroupMembers(){
      this._groupDetails.getGroupMembers(this.groupId).subscribe((data: any)=>{
      this.groupMembers = data;
      // this.splitExpenseUnequally = data;
      // console.log("split Expense equally " + this.splitExpenseUnequally[2].amount);

      this.populateCheckboxes();
      // this.populateSplitExpenseUnequally();
    },
    (error)=>{
      console.log(error);
      Swal.fire("Error !!", "Error in loading group members", "error");
    })
  }

  // Get Expenses 
  getExpenses(){
     this._groupDetails.getExpenses(this.groupId).subscribe((data:any)=>{
      this.expenses = data;
      for(let i=0;i<this.expenses.length;i++){
        let tempDate = this.expenses[i].date;
        this.expenses[i].date = tempDate.substring(0,10);
      }
    },
    (error)=>{
      console.log(error);
      Swal.fire("Error !!", "Error in loading expenses", "error")
    }
    )
  }
  


  // This method will initiate the expense form

  initiateExpenseForm(){
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split('T')[0];
    
    this.expenseForm = this.formBuilder.group({
      description: ['', [Validators.required]],
      amount: [null, [Validators.required, Validators.min(1)]],
      
      date: [formattedDate, [Validators.required]],
      upiId: [''],
      membersOfExpense: new FormArray([], [this.minSelectedCheckboxes(1)])
    });
    this.start = true;
  }

  /**
   * This method validates the minimum member selection for a expense.
   * @param min
   * @returns
   */
  // minSelectedCheckboxes(min = 1) {
  //   const validator: ValidatorFn = (formArray: FormArray) => {
  //     const totalSelected = formArray.controls
  //       .map((control) => control.value)
  //       .reduce((prev, next) => (next ? prev + next : prev), 0);

  //     return totalSelected >= min ? null : { required: true };
  //   };

  //   return validator;
  // }

  minSelectedCheckboxes(min: number): ValidatorFn {
    return (formArray: AbstractControl): { [key: string]: boolean } | null => {
      const selectedCount = (formArray as FormArray).controls
        .map(control => control.value)
        .reduce((prev, next) => (next ? prev + 1 : prev), 0);
      return selectedCount >= min ? null : { minSelected: true };
    };
  }



  // putting data to ExpenseDetails

  private putDataToExpenseDetails(){
    this.expenseDetails.description = this.expenseForm.value.description;
    this.expenseDetails.amount = this.expenseForm.value.amount;
    this.expenseDetails.upiId = this.expenseForm.value.upiId;
    this.expenseDetails.date = this.expenseForm.value.date;
    this.expenseDetails.addedBy.userId = this.loggedInUser.userId;
    this.expenseDetails.group = {groupId: this.groupId}
  }

  // add new expense
  addNewExpense(){
    this.putDataToExpenseDetails()

    let currentExpenseId: number;

    this._groupDetails.addExpense(this.expenseDetails).subscribe((data: any)=>{
      currentExpenseId = data.expenseId;
      Swal.fire("Success!!!", "Expense is added successfully", "success")
      console.log(data);
      
      data.date = data.date.substring(0,10);
      this.expenses.push(data);

      let numberOfInvolvedMembers = 0;
      this.expenseForm.value.membersOfExpense.forEach((element:any) => {
        if(element === true)
          numberOfInvolvedMembers++;
      });            
            
      let size = this.expenseForm.value.membersOfExpense.length;

      for(let i=0 ; i<size ; i++){

        if(this.expenseForm.value.membersOfExpense[i] === true){
          this.currentSplitExpense.user.userId = this.groupMembers[i].userId;
          this.currentSplitExpense.expense.expenseId = currentExpenseId;
          this.currentSplitExpense.amount = this.expenseForm.value.amount/(numberOfInvolvedMembers+1);
          this.currentSplitExpense.isPaid = false;

          this._groupDetails.addSplitExpense(this.currentSplitExpense).subscribe((data: any)=>{
            if(i==size-1){
              this.initiateExpenseForm();
              this.populateCheckboxes();
            }
          })
        }
      }


    });
  }

  // assign expense to Modal
  assignExpenseToModal(selectedExpense: any){
    // get expense in Modal
    this.expenseInModal = selectedExpense;
    
    // get splitExpenses in Modal
    this.getSplitExpensesInModal(selectedExpense.expenseId);
  }

  getSplitExpensesInModal(expenseId: any){
    this._groupDetails.getSplitExpensesInModal(expenseId).subscribe((data: any)=>{
      this.splitExpensesInModal = data;
      
      let count = 1;
      this.expenseSettled = false;
      if(this.expenseInModal.addedBy.email == this.loggedInUser.email){
        this.splitExpensesInModal.forEach((ele: any)=>{
          if(ele.isPaid == true){
            count++;
          }
        });
        if(count == this.splitExpensesInModal.length){    
          this.expenseSettled = true;
        }
      }
    },
    (error)=>{
      Swal.fire("Error!!", "Error in loading expense details", "error");
      console.log(error);
    }
    )
  }

  deleteExpense(expense: any){

    Swal.fire({
      title: 'Are you sure?',
      text: 'You won\'t be able to revert this!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        
        // Perform your delete action here
        let expenseId = expense.expenseId;
    
        this._groupDetails.getSplitExpensesInModal(expenseId).subscribe((data: any)=>{
          this.splitExpensesToBeDeleted = data;
          this.splitExpensesToBeDeleted.forEach(splitExpense => {
            this._groupDetails.deleteSplitExpense(splitExpense.splitExpenseId).subscribe((data: any)=>{})
          });
          this._groupDetails.deleteExpense(expenseId).subscribe((data: any)=>{
            this.expenses = this.expenses.filter((tempExpense)=>tempExpense.expenseId != expenseId)
            Swal.fire('Deleted!', 'Expense has been deleted.', 'success');
          },
          (error)=>{
            Swal.fire("Error", "Error in deleting expense", 'error');
          }
          )
        })
      }
    });
  }

  splitEquallySelected(){
    this.splitEqually = true;
    this.splitUnequally = false;
    this.splitByPercent = false;
    this.splitByShares = false;
  }

  splitUnequallySelected(){
    this.splitUnequally = true;
    this.splitEqually = false;
    this.splitByPercent = false;
    this.splitByShares = false;
  };

  splitByPercentSelected(){
    this.splitByPercent = true;
    this.splitEqually = false;
    this.splitUnequally = false;
    this.splitByShares = false;
  };
  splitBySharesSelected(){
    this.splitByShares = true;
    this.splitEqually = false;
    this.splitUnequally = false;
    this.splitByPercent = false;
  }


}
